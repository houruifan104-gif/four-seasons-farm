from pathlib import Path
root = Path(__file__).resolve().parent.parent
css = (root / 'style.css').read_text()
# Bundle the game and transport for file:// use. PeerJS is vendored locally; networking starts only when a room opens.
js = '\n'.join((root / name).read_text() for name in ['card-catalog.js', 'multiplayer.js', 'original-rules.js', 'cover-mode.js', 'game.js']).replace('</script', '<\\/script')
(root / 'play.html').write_text('<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#f2eddf"><title>四季田园 · 农场策略游戏</title><style>\n' + css + '\n</style></head><body><div id="app"></div><script src="./vendor/peerjs.min.js"></script><script src="./vendor/mammoth.browser.min.js"></script><script>\n' + js + '\n</script></body></html>\n')
