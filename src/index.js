import Phaser from 'phaser';

const _inputs = [];
const _masks = [];
const _shapes = {
  Circle: new Phaser.Geom.Circle(),
  Ellipse: new Phaser.Geom.Ellipse(),
  Rectangle: new Phaser.Geom.Rectangle(),
  Triangle: new Phaser.Geom.Triangle()
};

function getLeft (obj) {
  return obj.originX ? (obj.x - obj.originX * obj.displayWidth) : obj.x;
}

function getTop (obj) {
  return obj.originY ? (obj.y - obj.originY * obj.displayHeight) : obj.y;
}

function getShapeName (shape) {
  switch (shape.constructor.name) {
    default:
    case 'Rectangle':
      return 'Rect';
    case 'Circle':
    case 'Ellipse':
    case 'Triangle':
      return shape.constructor.name;
  }
}

class DebugDrawPlugin extends Phaser.Plugins.ScenePlugin {
  boot () {
    if (Phaser.Class.name !== 'Class') {
      console.warn('DebugDrawPlugin does not work with the minified version of Phaser. Plugin not loaded.');
    } else {
      this.systems.events
        .on('start', this.sceneStart, this)
        .on('render', this.sceneRender, this)
        .on('shutdown', this.sceneShutdown, this)
        .once('destroy', this.sceneDestroy, this);
    }
  }

  sceneStart () {
    this.graphic = this.scene.add.graphics();
  }

  sceneShutdown () {
    this.graphic.destroy();
    this.graphic = null;
  }

  sceneRender () {
    this.drawAll();
  }

  drawAll () {
    const inputs = _inputs;
    const masks = _masks;
    const { displayList } = this.systems;

    if (!displayList.length) return;

    inputs.length = 0;
    masks.length = 0;

    this.graphic.clear().lineStyle(this.lineWidth, this.color, this.alpha);

    displayList.each(this.processObj, this, inputs, masks);
    if (inputs.length) this.drawObjsInputs(inputs);
    if (masks.length) this.drawObjsMasks(masks);
  }

  processObj (obj, inputs, masks) {
    this.drawObj(obj);

    if (obj.input) {
      inputs[inputs.length] = obj;
    }

    if (obj.mask && masks.indexOf(obj) === -1) {
      masks[masks.length] = obj;
    }
  }

  sceneDestroy () {
    this.systems.events
      .off('start', this.sceneStart, this)
      .off('render', this.sceneRender, this)
      .off('shutdown', this.sceneShutdown, this)
      .off('destroy', this.sceneDestroy, this);

    this.scene = null;
    this.systems = null;
  }

  drawObjsInputs (objs) {
    this.graphic.lineStyle(this.lineWidth, this.inputColor, this.alpha);
    objs.forEach(this.drawObjInput, this);
  }

  drawObjsMasks (objs) {
    this.graphic.fillStyle(this.maskColor, this.alpha).lineStyle(this.lineWidth, this.maskColor, this.alpha);
    objs.forEach(this.drawObjMask, this);
  }

  drawObj (obj) {
    this.graphic.strokeRect(getLeft(obj), getTop(obj), obj.displayWidth, obj.displayHeight);
  }

  drawObjInput (obj) {
    const { hitArea } = obj.input;
    const ctor = hitArea.constructor;
    const shape = _shapes[ctor.name];
    if (shape) {
      ctor.CopyFrom(hitArea, shape);
      ctor.Offset(shape, getLeft(obj), getTop(obj));

      this.graphic['stroke' + getShapeName(shape) + 'Shape'](shape);
    }
  }

  drawObjMask (obj) {
    if (obj.mask.bitmapMask) this.drawObjBitmapMask(obj);
  }

  drawObjBitmapMask (obj) {
    this.drawObj(obj.mask.bitmapMask);
  }

  bringToTop () {
    this.systems.displayList.bringToTop(this.graphic);
  }
}

Object.assign(DebugDrawPlugin.prototype, {
  alpha: 0.5,
  color: 0x00ddff,
  inputColor: 0xffcc00,
  lineWidth: 2,
  maskColor: 0xff0022
});

if (typeof window !== 'undefined') {
  window.PhaserDebugDrawPlugin = DebugDrawPlugin;
}

export default DebugDrawPlugin;
