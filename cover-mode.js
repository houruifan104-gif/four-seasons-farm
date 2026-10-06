/* Local document switcher. Kept outside game state and multiplayer snapshots. */
(() => {
  'use strict';
  const PREF_KEY='farm-document-shortcut-v1';
  const fallback={code:'KeyQ',alt:true,ctrl:false,meta:false,shift:false};
  let shortcut={...fallback},doc=null,active=false,recording=false,loading=true,uploading=false,originalTitle='',lastFocus=null,objectURL=null;
  try { const saved=JSON.parse(localStorage.getItem(PREF_KEY)); if(saved&&validShortcut(saved))shortcut=saved; } catch (_) {}
  const dialog=document.createElement('dialog');dialog.className='cover-settings';dialog.setAttribute('aria-label','摸鱼模式设置');
  dialog.innerHTML=`<form method="dialog"><button class="cover-close" aria-label="关闭设置">×</button></form><p class="cover-eyebrow">QUICK SWITCH</p><h2>摸鱼模式</h2><p>把自己的文档放在这里，需要时按快捷键立即切换。</p><label class="cover-upload">选择文档<input type="file" accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp" aria-label="选择摸鱼文档"></label><small>支持 PDF、Word（.docx）、文本和图片，最大 20 MB。Word 显示文字、标题与表格；复杂排版建议转成 PDF。</small><p class="cover-file" role="status"></p><div class="cover-key-row"><span>切换快捷键</span><button type="button" class="cover-key"></button></div><small>点击上面的按键后，按下新组合。仅当前游戏页面聚焦时有效，浏览器或系统占用的快捷键可能无效。</small><p class="cover-feedback" role="status"></p><p class="cover-note">文档只保存在此浏览器，不发送到服务器或联机房间。切换时游戏进度保留，联机对局继续进行。</p><div class="cover-setting-actions"><button type="button" class="cover-remove">移除文档</button><button type="button" class="cover-preview">切换到文档</button></div>`;
  const viewer=document.createElement('section');viewer.className='cover-viewer';viewer.hidden=true;viewer.setAttribute('aria-label','文档预览');
  viewer.innerHTML='<header class="cover-toolbar"><span class="cover-doc-icon">▤</span><strong></strong><button type="button" aria-label="返回游戏" title="返回游戏">↩</button></header><div class="cover-content"></div>';
  document.body.append(dialog,viewer);
  const fileInput=dialog.querySelector('input'),fileStatus=dialog.querySelector('.cover-file'),feedback=dialog.querySelector('.cover-feedback'),keyButton=dialog.querySelector('.cover-key'),preview=dialog.querySelector('.cover-preview'),remove=dialog.querySelector('.cover-remove'),content=viewer.querySelector('.cover-content');
  function validShortcut(s){
    if(!/^(Key[A-Z]|Digit[0-9]|F[2-9]|F10)$/.test(s.code))return false;
    if(s.code==='F5'||(!s.alt&&!s.ctrl&&!s.meta&&!/^F/.test(s.code)))return false;
    if(s.alt&&s.code==='F4')return false;
    if((s.ctrl||s.meta)&&!s.alt&&/^Key[ALNQRTW]$/.test(s.code))return false;
    return ['ctrl','alt','meta','shift'].every(k=>typeof s[k]==='boolean');
  }
  function keyLabel(s){return [s.ctrl?'Ctrl':'',s.alt?'Alt / ⌥':'',s.shift?'Shift':'',s.meta?'⌘':'',s.code.replace(/^Key|^Digit/,'')].filter(Boolean).join(' + ');}
  function showStatus(message){feedback.textContent=message;}
  function refresh(){fileStatus.textContent=loading?'正在读取已保存文档…':uploading?'正在准备文档…':doc?`已就绪：${doc.name}`:'尚未选择文档';keyButton.textContent=recording?'请按快捷键…（Esc 取消）':keyLabel(shortcut);preview.disabled=!doc||uploading;remove.disabled=!doc||uploading;fileInput.disabled=uploading||loading;}
  let dbPromise;
  function db(){return dbPromise||=(new Promise((resolve,reject)=>{const request=indexedDB.open('farm-private-document',1);request.onupgradeneeded=()=>request.result.createObjectStore('documents');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}));}
  async function stored(mode,value){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('documents',mode==='read'?'readonly':'readwrite'),store=tx.objectStore('documents');const request=mode==='read'?store.get('current'):mode==='remove'?store.delete('current'):store.put(value,'current');tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  // Copy only passive document elements; never insert uploaded HTML or external links.
  function safeWordHTML(html){
    const source=new DOMParser().parseFromString(html,'text/html');
    const allowed=new Set(['P','BR','H1','H2','H3','H4','H5','H6','STRONG','EM','U','S','SUP','SUB','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','BLOCKQUOTE','HR']);
    function copy(node,parent){if(node.nodeType===3){parent.append(document.createTextNode(node.textContent));return;}if(node.nodeType!==1)return;if(['SCRIPT','STYLE','IFRAME','OBJECT','IMG'].includes(node.tagName))return;const dest=allowed.has(node.tagName)?document.createElement(node.tagName.toLowerCase()):document.createDocumentFragment();for(const child of node.childNodes)copy(child,dest);parent.append(dest);}
    const result=document.createElement('div');for(const node of source.body.childNodes)copy(node,result);return result.innerHTML;
  }
  async function prepare(file){
    if(file.size>20*1024*1024)throw Error('文档超过 20 MB，请选择较小的文件。');
    const ext=file.name.split('.').pop().toLowerCase(),base={name:file.name};
    if(ext==='pdf'){
      if(!(await file.slice(0,1024).text()).includes('%PDF-'))throw Error('这个文件不是有效的 PDF。');
      return {...base,kind:'pdf',blob:new Blob([file],{type:'application/pdf'})};
    }
    if(['png','jpg','jpeg','webp'].includes(ext)){
      const blob=new Blob([file],{type:ext==='jpg'||ext==='jpeg'?'image/jpeg':`image/${ext}`});
      const bitmap=await createImageBitmap(blob);bitmap.close();return {...base,kind:'image',blob};
    }
    if(ext==='docx'){
      const result=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{externalFileAccess:false,includeEmbeddedStyleMap:false,convertImage:window.mammoth.images.imgElement(()=>Promise.resolve({src:''}))});
      const html=safeWordHTML(result.value);if(!html.trim())throw Error('文档中没有可预览的文字，请转成 PDF 或图片后上传。');return {...base,kind:'word',html};
    }
    if(['txt','md','csv'].includes(ext))return {...base,kind:'text',text:await file.text()};
    throw Error('暂不支持此格式，请使用 PDF、DOCX、TXT、Markdown、CSV 或图片。');
  }
  function mountDocument(){
    if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}
    content.replaceChildren();if(!doc)return;
    viewer.querySelector('strong').textContent=doc.name;
    if(doc.kind==='pdf'){
      objectURL=URL.createObjectURL(doc.blob);const frame=document.createElement('iframe');frame.title=doc.name;frame.src=objectURL;content.append(frame);
      const hint=document.createElement('p');hint.className='cover-pdf-hint';hint.textContent='PDF 内按键无响应时，点击右上角 ↩ 返回。';content.append(hint);
    }else if(doc.kind==='image'){
      objectURL=URL.createObjectURL(doc.blob);const img=document.createElement('img');img.src=objectURL;img.alt=doc.name;content.append(img);
    }else{
      const page=document.createElement('article');page.className='cover-paper';
      if(doc.kind==='word')page.innerHTML=safeWordHTML(doc.html);else{const text=document.createElement('pre');text.textContent=doc.text;page.append(text);}content.append(page);
    }
  }
  function openSettings(){showStatus('');refresh();if(!dialog.open)dialog.showModal();}
  function toggle(){
    if(active){active=false;viewer.hidden=true;document.body.classList.remove('cover-active');document.querySelector('#app').inert=false;document.title=originalTitle;if(lastFocus?.isConnected)lastFocus.focus();return;}
    if(!doc){openSettings();showStatus(loading?'正在读取文档，请稍候。':'先选择一份文档，即可使用快捷切换。');return;}
    recording=false;dialog.close();lastFocus=document.activeElement;originalTitle=document.title;active=true;document.title=doc.name;viewer.hidden=false;document.body.classList.add('cover-active');document.querySelector('#app').inert=true;viewer.querySelector('button').focus();
  }
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files[0];if(!file)return;uploading=true;showStatus('');refresh();
    try{const ready=await prepare(file);doc=ready;mountDocument();try{await stored('write',doc);showStatus('已保存，下次打开可直接切换。');}catch(_){showStatus('当前浏览器无法保存文档，本次仍可使用；刷新后需重新选择。');}}catch(error){showStatus(error.message||'无法读取此文档，请换一个文件。');}
    finally{uploading=false;fileInput.value='';refresh();}
  });
  keyButton.addEventListener('click',()=>{recording=!recording;showStatus('');refresh();});
  preview.addEventListener('click',toggle);viewer.querySelector('button').addEventListener('click',toggle);
  remove.addEventListener('click',async()=>{try{await stored('remove');doc=null;mountDocument();showStatus('已移除文档。');}catch(_){showStatus('无法清除已保存的文档，请稍后再试。');}refresh();});
  dialog.addEventListener('close',()=>{recording=false;refresh();});
  document.addEventListener('click',event=>{if(event.target.closest('[data-cover-settings]'))openSettings();});
  window.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    const candidate={code:event.code,ctrl:event.ctrlKey,alt:event.altKey,meta:event.metaKey,shift:event.shiftKey};
    if(recording){event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;if(event.code==='Escape'){recording=false;refresh();return;}if(/^(Control|Alt|Shift|Meta)/.test(event.code))return;if(!validShortcut(candidate)){showStatus('请用 Alt/Ctrl/⌘ 加字母或数字，或 F2–F10（不含 F5）；避开浏览器常用快捷键。');return;}shortcut=candidate;recording=false;try{localStorage.setItem(PREF_KEY,JSON.stringify(shortcut));showStatus('快捷键已保存。');}catch(_){showStatus('快捷键本次生效，刷新后需重新设置。');}refresh();return;}
    if(Object.keys(fallback).every(k=>candidate[k]===shortcut[k])){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)toggle();}
    else if(active&&event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();toggle();}
  },true);
  refresh();stored('read').then(saved=>{if(saved){doc=saved;mountDocument();}}).catch(()=>{}).finally(()=>{loading=false;refresh();});
})();
