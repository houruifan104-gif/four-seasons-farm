/* Room transport. The host owns the game; guests submit commands, never game states. */
(() => {
  const PROTOCOL = 'four-seasons-room-v1';
  const SESSION_KEY = 'four-seasons-online-session';
  const cleanName = value => String(value || '').replace(/[<>\x00-\x1f]/g, '').trim().slice(0, 16) || '农场主';
  const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
  class FarmRoom {
    constructor(callbacks) {
      this.callbacks = callbacks;
      this.active = false; this.started = false; this.host = false; this.seat = 0;
      this.code = ''; this.members = []; this.links = new Map(); this.revision = 0;
      this.status = ''; this.error = ''; this.pending = false; this.snapshot = null;
      this.epoch = 0;
    }
    get paused() { return this.started && (this.status !== 'playing' || this.members.some(m => !m.online)); }
    saved() { try { const s = JSON.parse(sessionStorage.getItem(SESSION_KEY)); return s?.protocol === PROTOCOL ? s : null; } catch (_) { return null; } }
    remember() {
      if (!this.active) return;
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ protocol: PROTOCOL, host: this.host, code: this.code, token: this.token, name: this.name, settings: this.settings, members: this.host ? this.members : [], snapshot: this.host ? this.snapshot : null, revision: this.revision, started: this.started })); } catch (_) { /* live connection still works */ }
    }
    notify() { this.remember(); this.callbacks.change?.(); }
    send(link, message) { if (link?.open) { try { link.send({ ...message, protocol: PROTOCOL }); } catch (_) { return false; } return true; } return false; }
    async open({ host = false, code = '', name = '', settings = {}, resume = false } = {}) {
      if (!window.Peer) { this.error = '联机组件加载失败，请刷新页面重试。'; this.callbacks.change?.(); return; }
      const saved = resume ? this.saved() : null;
      this.close(false);
      this.active = true; this.host = saved ? saved.host : host; this.name = saved?.name || cleanName(name);
      this.code = saved?.code || (host ? makeCode() : String(code).trim().toUpperCase());
      this.token = saved?.token || crypto.randomUUID(); this.settings = saved?.settings || settings;
      this.started = !!saved?.started && this.host; this.snapshot = this.host ? saved?.snapshot || null : null;
      this.revision = this.host ? saved?.revision || 0 : 0; this.seat = 0;
      this.members = this.host ? saved?.members?.length ? saved.members.map((m, i) => ({ ...m, online: i === 0 })) : [{ name: this.name, token: this.token, online: true }] : [];
      this.status = 'connecting'; this.error = ''; this.pending = false;
      if (!/^[A-HJ-NP-Z2-9]{8}$/.test(this.code)) { this.status = 'disconnected'; this.error = '请输入 8 位房间码。'; this.notify(); return; }
      const epoch = this.epoch;
      const peer = this.peer = new Peer(this.host ? `ssf-${this.code}` : undefined, { debug: 0 });
      this.connectTimer = setTimeout(() => { if (this.epoch === epoch && this.status === 'connecting') { this.error = '连接超时，请检查网络后点重新连接。'; this.status = 'disconnected'; this.notify(); } }, 20000);
      peer.on('open', () => {
        if (epoch !== this.epoch) return;
        if (this.host) {
          clearTimeout(this.connectTimer); this.status = this.started ? 'playing' : 'lobby';
          if (this.snapshot) this.callbacks.state?.(this.snapshot, 0);
          this.notify();
        } else this.connectHost(epoch);
      });
      peer.on('connection', link => { if (this.host && epoch === this.epoch) this.accept(link, epoch); else link.close(); });
      peer.on('error', error => {
        if (epoch !== this.epoch) return;
        const messages = { 'unavailable-id': '房间码仍被占用，请等几秒后重新连接。', 'peer-unavailable': '找不到房间，请确认房间码并让房主保持页面打开。', 'network': '网络中断，请重新连接。', 'browser-incompatible': '此浏览器不支持联机，请使用新版 Safari 或 Chrome。' };
        this.error = messages[error.type] || '联机连接失败，请换个网络后重试。';
        if (!this.started || !this.host) this.status = 'disconnected';
        this.pending = false; this.notify();
      });
      peer.on('disconnected', () => { if (epoch === this.epoch && !peer.destroyed) peer.reconnect(); });
      this.heartbeat = setInterval(() => {
        if (epoch !== this.epoch) return;
        if (this.host) {
          for (const [seat, link] of this.links) {
            if (Date.now() - (link.lastSeen || 0) > 18000) { link.close(); this.drop(seat, link); }
            else this.send(link, { type: 'ping' });
          }
        } else if (this.hostLink?.open && Date.now() - (this.lastHostSeen || 0) > 22000) {
          this.hostLink.close(); this.status = 'disconnected'; this.pending = false; this.error = '与房主断开，重新连接可回到原座位。'; this.notify();
        }
      }, 5000);
      this.notify();
    }
    connectHost(epoch) {
      const link = this.hostLink = this.peer.connect(`ssf-${this.code}`, { reliable: true, serialization: 'json' });
      link.on('open', () => {
        if (epoch !== this.epoch) return;
        this.lastHostSeen = Date.now();
        this.send(link, { type: 'hello', token: this.token, name: this.name });
      });
      link.on('data', data => {
        if (epoch !== this.epoch || data?.protocol !== PROTOCOL) return;
        this.lastHostSeen = Date.now();
        if (data.type === 'ping') { this.send(link, { type: 'pong' }); return; }
        if (data.type === 'closed') { this.status = 'disconnected'; this.pending = false; this.error = '房主已关闭房间。'; this.notify(); return; }
        if (data.type === 'error') { this.error = data.message; this.pending = false; this.notify(); return; }
        if (data.type !== 'state' || !Number.isInteger(data.seat) || data.revision < this.revision) return;
        clearTimeout(this.connectTimer); clearTimeout(this.pendingTimer);
        const changed = data.revision !== this.revision || !this.started;
        this.seat = data.seat; this.members = data.members; this.settings = data.settings;
        this.revision = data.revision; this.started = !!data.game; this.status = this.started ? 'playing' : 'lobby'; this.pending = false; this.error = '';
        if (data.game && changed) { this.snapshot = data.game; this.callbacks.state?.(data.game, this.seat); }
        this.notify();
      });
      link.on('close', () => { if (epoch !== this.epoch) return; this.status = 'disconnected'; this.pending = false; this.error = '与房主断开，重新连接可回到原座位。'; this.notify(); });
      link.on('error', () => { if (epoch === this.epoch) { this.status = 'disconnected'; this.error = '无法建立连接，请换个网络重试。'; this.notify(); } });
    }
    accept(link, epoch) {
      let seat = -1;
      const timer = setTimeout(() => { if (seat < 0) link.close(); }, 12000);
      link.on('data', data => {
        if (epoch !== this.epoch || data?.protocol !== PROTOCOL) return;
        link.lastSeen = Date.now();
        if (data.type === 'hello' && seat < 0) {
          if (typeof data.token !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.token)) return;
          seat = this.members.findIndex(m => m.token === data.token);
          if (seat === 0 || (seat < 0 && (this.started || (this.members.length >= Number(this.settings.players || 6) && !this.members.some((m, i) => i > 0 && !m.online))))) {
            this.send(link, { type: 'error', message: this.started ? '对局已开始，只能由原来的玩家重连。' : '房间已满。' }); return;
          }
          if (seat < 0) { const vacant = this.members.findIndex((m, i) => i > 0 && !m.online); seat = vacant < 0 ? this.members.length : vacant; this.members[seat] = { token: data.token, name: cleanName(data.name), online: true }; }
          const previous = this.links.get(seat);
          this.links.set(seat, link); previous?.close();
          this.members[seat].online = true; clearTimeout(timer); this.broadcast(); this.notify(); return;
        }
        if (seat < 1 || this.links.get(seat) !== link) return;
        if (data.type === 'pong') return;
        if (data.type === 'sync') { this.sendState(link, seat); return; }
        if (data.type !== 'command' || !this.started) return;
        if (data.revision !== this.revision || this.paused) { this.sendState(link, seat); return; }
        const error = this.callbacks.command?.(seat, data.command);
        if (error) { this.send(link, { type: 'error', message: error }); this.sendState(link, seat); }
      });
      link.on('close', () => { clearTimeout(timer); if (epoch === this.epoch) this.drop(seat, link); });
      link.on('error', () => { if (epoch === this.epoch) { link.close(); this.drop(seat, link); } });
    }
    drop(seat, link) {
      if (seat < 1 || this.links.get(seat) !== link) return;
      this.links.delete(seat); this.members[seat].online = false;
      this.broadcast(); this.notify();
    }
    sendState(link, seat) {
      this.send(link, { type: 'state', seat, revision: this.revision, settings: this.settings, members: this.members.map(({ name, online }) => ({ name, online })), game: this.started ? this.snapshot : null });
    }
    broadcast() { for (const [seat, link] of this.links) this.sendState(link, seat); }
    publish(game) {
      if (!this.active || !this.host || !this.started) return;
      this.snapshot = JSON.parse(JSON.stringify(game)); this.revision++; this.broadcast(); this.remember();
    }
    start(game) {
      if (!this.host || this.started || this.members.length < 2 || this.members.some(m => !m.online)) return false;
      this.started = true; this.status = 'playing'; this.publish(game); this.notify(); return true;
    }
    submit(command) {
      if (this.paused || this.pending || !this.started) return;
      if (this.host) { const error = this.callbacks.command?.(0, command); if (error) { this.error = error; this.notify(); } return; }
      this.pending = true;
      if (!this.send(this.hostLink, { type: 'command', revision: this.revision, command })) { this.pending = false; this.status = 'disconnected'; this.error = '连接已断开，请重新连接。'; }
      else this.pendingTimer = setTimeout(() => { this.pending = false; this.error = '尚未收到结果，正在重新同步。'; this.send(this.hostLink, { type: 'sync' }); this.notify(); }, 8000);
      this.notify();
    }
    close(forget = true) {
      if (this.host) for (const link of this.links.values()) this.send(link, { type: 'closed' });
      this.epoch++; clearInterval(this.heartbeat); clearTimeout(this.connectTimer); clearTimeout(this.pendingTimer);
      this.peer?.destroy(); this.peer = null; this.hostLink = null; this.links.clear();
      this.active = false; this.started = false; this.pending = false; this.status = ''; this.error = '';
      if (forget) { try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {} }
    }
  }
  window.FarmRoom = FarmRoom;
})();
