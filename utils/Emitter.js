import EventEmitter from 'tiny-emitter'

const Emitter = new EventEmitter();
Emitter.ONRESIZE = 'on_resize'
Emitter.ONSCROLL = 'on_scroll'
Emitter.ONSCROLLWHEEL = 'on_scroll_wheel'
Emitter.ONMOUSEMOVE = 'on_mouse_move'
Emitter.ONMOUSEDOWN = 'on_mouse_down'
Emitter.ONMOUSEUP = 'on_mouse_up'
Emitter.ONKEYDOWN = 'on_key_down'
Emitter.ONKEYUP = 'on_key_up'
Emitter.ONTOUCHSTART = 'on_touch_start'
Emitter.ONTOUCHMOVE = 'on_touch_move'
Emitter.ONTOUCHEND = 'on_touch_end'

const _onResize = (event) =>{
  Emitter.emit(Emitter.ONRESIZE, window.innerWidth, window.innerHeight)
}

const _onScroll = (event) =>{
  Emitter.emit(Emitter.ONSCROLL, event)
}

const _onWindowMousemove = (event) =>{
  Emitter.emit(Emitter.ONMOUSEMOVE, event)
}

const _onWindowMousedown = (event) =>{
  Emitter.emit(Emitter.ONMOUSEDOWN, event)
}

const _onWindowMouseup = (event) =>{
  Emitter.emit(Emitter.ONMOUSEUP, event)
}

const _onKeydown = (event) =>{
  Emitter.emit(Emitter.ONKEYDOWN, event)
}

const _onKeyup = (event) =>{
  Emitter.emit(Emitter.ONKEYUP, event)
}

const _onWindowTouchstart = (event) =>{
  Emitter.emit(Emitter.ONTOUCHSTART, event)
}

const _onWindowTouchmove = (event) =>{
  Emitter.emit(Emitter.ONTOUCHMOVE, event)
}

const _onWindowTouchend = (event) =>{
  Emitter.emit(Emitter.ONTOUCHEND, event)
}

window.addEventListener("resize", _onResize)
window.addEventListener("scroll", _onScroll)
window.addEventListener("mousemove", _onWindowMousemove)
window.addEventListener("mousedown", _onWindowMousedown)
window.addEventListener("mouseup", _onWindowMouseup)
document.addEventListener("keydown", _onKeydown)
document.addEventListener("keyup", _onKeyup)
window.addEventListener("touchstart", _onWindowTouchstart)
window.addEventListener("touchmove", _onWindowTouchmove)
window.addEventListener("touchend", _onWindowTouchend)


export default Emitter;