
'use strict';

var frzr = require('../dist/frzr-server.js');
var test = require('tape');
var body = new frzr.View({
  el: 'div'
});

console.log('TESTING SERVER-SIDE');

test('create and destroy view', function (t) {
  t.plan(2);

  var p = new frzr.View({
    el: ['p', { text: 'Hi!' }]
  });

  body.setChildren([p]);

  t.equal(body.render(), '<div><p>Hi!</p></div>', 'View mounted');

  p.destroy();
  t.equal(body.render(), '<div>', 'View destroyed');
});

test('create, update and destroy viewlist', function (t) {
  t.plan(3);

  var ul = new frzr.View({
    el: 'ul'
  });

  var Li = frzr.View.extend({
    el: 'li',
    update (data) {
      this.setText(data);
    }
  });

  var list = new frzr.ViewList({
    View: Li
  });

  list.update([1, 2, 3]);

  ul.addChild(list);
  body.addChild(ul);

  t.equal(body.render(), '<div><ul><li>1</li><li>2</li><li>3</li></ul></div>', 'ViewList mounted');

  list.update([3, 1, 2]);

  t.equal(body.render(), '<div><ul><li>3</li><li>1</li><li>2</li></ul></div>', 'ViewList updated');

  list.destroy();

  t.equal(body.render(), '<div><ul></div>', 'ViewList destroyed');

  ul.destroy();
});

test('animation', function (t) {
  t.plan(1);

  var animationFrames = 0;

  var p = new frzr.View({
    el: ['p', { text: 'Hello' }],
    init: function () {
      var view = this;

      view.animation = new frzr.Animation({
        duration: 1000,
        easing: 'quartInOut',
        progress: function (t) {
          animationFrames++;
          view.setStyle('transform', frzr.translate(100 * (1 - t), '%', 0));
        },
        end () {
          t.pass(`Animation worked (${animationFrames} fps)`);
        }
      });
    }
  });

  body.addChild(p);
});