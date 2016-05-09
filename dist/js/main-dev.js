(function () {
  'use strict';

  var customElements;
  var customAttributes;

  function el (tagName) {
    var arguments$1 = arguments;

    if (customElements) {
      var customElement = customElements[tagName];

      if (customElement) {
        return customElement.apply(this, arguments);
      }
    }

    var element = document.createElement(tagName);

    for (var i = 1; i < arguments$1.length; i++) {
      var arg = arguments$1[i];

      if (arg == null) {
        continue;
      } else if (mount(element, arg)) {
        continue;
      } else if (typeof arg === 'object') {
        for (var attr in arg) {
          if (customAttributes) {
            var customAttribute = customAttributes[attr];
            if (customAttribute) {
              customAttribute(element, arg[attr]);
              continue;
            }
          }
          var value = arg[attr];
          if (attr === 'style' || (element[attr] == null && typeof value != 'function')) {
            element.setAttribute(attr, value);
          } else {
            element[attr] = value;
          }
        }
      }
    }

    return element;
  }

  function registerElement (tagName, handler) {
    customElements || (customElements = {});
    customElements[tagName] = handler;
  }

  function List (View, key, initData, skipRender) {
    this.View = View;
    this.views = [];
    this.initData = initData;
    this.skipRender = skipRender;

    if (key) {
      this.key = key;
      this.lookup = {};
    }
  }

  List.prototype.update = function (data, cb) {
    var View = this.View;
    var views = this.views;
    var parent = this.parent;
    var key = this.key;
    var initData = this.initData;
    var skipRender = this.skipRender;

    if (cb) {
      var added = [];
      var updated = [];
      var removed = [];
    }

    if (key) {
      var lookup = this.lookup;
      var newLookup = {};

      views.length = data.length;

      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var id = item[key];
        var view = lookup[id];

        if (!view) {
          view = new View(initData, item, i);
          cb && added.push(view);
        } else {
          cb && updated.push(view);
        }

        views[i] = newLookup[id] = view;

        view.update && view.update(item, i);
      }

      if (cb) {
        for (var id in lookup) {
          if (!newLookup[id]) {
            removed.push(lookup[id]);
            !skipRender && parent && unmount(parent, lookup[id]);
          }
        }
      }

      this.lookup = newLookup;
    } else {
      if (cb) {
        for (var i = data.length; i < views.length; i++) {
          var view = views[i];

          !skipRender && parent && unmount(parent, view);
          removed.push(view);
        }
      }

      views.length = data.length;

      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var view = views[i];

        if (!view) {
          view = new View(initData, item, i);
          cb && added.push(view);
        } else {
          cb && updated.push(view);
        }

        view.update && view.update(item, i);
        views[i] = view;
      }
    }

    !skipRender && parent && setChildren(parent, views);
    cb && cb(added, updated, removed);
  }

  function mount (parent, child, before) {
    var parentEl = parent.el || parent;
    var childEl = child.el || child;
    var childWasMounted = childEl.parentNode != null;

    if (childWasMounted) {
      child.remounting && child.remounting();
    } else {
      child.mounting && child.mounting();
    }

    if (childEl instanceof Node) {
      if (before) {
        var beforeEl = before;
        parentEl.insertBefore(childEl, beforeEl);
      } else {
        parentEl.appendChild(childEl);
      }

      if (childWasMounted) {
        child.remounted && child.remounted();
      } else {
        child.mounted && child.mounted();
      }
      if (childEl !== child) {
        childEl.view = child;
        child.parent = parent;
      }

    } else if (typeof childEl === 'string' || typeof childEl === 'number') {
      mount(parentEl, document.createTextNode(childEl), before);

    } else if (childEl instanceof Array) {
      for (var i = 0; i < childEl.length; i++) {
        mount(parentEl, childEl[i], before);
      }

    } else if (child instanceof List) {
      child.parent = parent;
      setChildren(parentEl, child.views);

    } else {
      return false;
    }
    return true;
  }

  function unmount (parent, child) {
    var parentEl = parent.el || parent;
    var childEl = child.el || child;

    child.unmounting && child.unmounting();

    parentEl.removeChild(childEl);

    child.unmounted && child.unmounted();

    if (childEl !== child) {
      child.parent = null;
    }
  }

  function setChildren (parent, children) {
    var parentEl = parent.el || parent;
    var traverse = parentEl.firstChild;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var childEl = child.el || child;

      if (traverse === childEl) {
        traverse = traverse.nextSibling;
        continue;
      }

      mount(parent, child, traverse);
    }

    while (traverse) {
      var next = traverse.nextSibling;

      unmount(parent, traverse.view || traverse);

      traverse = next;
    }
  }

  var handlers = {};

  var api = {
    on: function on (type, handler) {
      handlers[type] || (handlers[type] = []);

      handlers[type].push({
        handler: handler
      });
    },
    one: function one (type, handler) {
      handlers[type] || (handlers[type] = []);

      handlers[type].push({
        handler: handler,
        once: true
      });
    },
    trigger: function trigger (type, data) {
      var this$1 = this;

      var currentHandlers = handlers[type];

      if (currentHandlers) {
        for (var i = 0; i < currentHandlers.length; i++) {
          var handler = currentHandlers[i];

          handler.handler.call(this$1, data);

          if (handler.once) {
            currentHandlers.splice(i--, 1);
          }
        }
      }
    }
  }

  var sections = {
    hello: 'Hello',
    features: 'Features'
  };

  var Topbar = function Topbar () {
    this.el = el('div', { class: 'topbar' },
      el('div', { class: 'topbar-menu' },
        el('div', { class: 'topbar-menuitem' },
          el('i', { class: 'fa fa-bars' }),
          this.current = el('p')
        )
      )
    );
  };
  Topbar.prototype.update = function update (section, subsection) {
    this.current.textContent = sections[section];
  };

  function hello () {
    return [
      el('h2', 'Hello FRZR'),

      el('p', "Web development has gone mad. To get even started with today's frameworks, at worst you need to install huge loads of dependencies, learn all kinds of weird abstractions and just a hello world app weighs hundreds of kilobytes."),

      el('p', "FRZR is here to cool us down. The whole view library weighs only 2 KB and it's ", el('a', { href: 'https://youtu.be/0nh2EK1xveg', target: '_blank' }, 'possible to teach in 30 minutes how it works under the hood'), ". There's as few abstractions as possible. You don't need to install anything to get started. You only need to know HTML and Javascript, that's it."),

      el('p',
        el('a', { href: '#/features' }, "Wow, FRZR is really small. What features do I get?")
      )
    ];
  }

  function features () {
    return [
      el('h2', 'Features'),
      el('h3', "It's just HTML + JS"),
      el('p', 'index.html:'),
      el('code-html', "\n<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\">\n    <title>FRZR example</title>\n  </head>\n  <body>\n    <script src=\"https://frzr.js.org/frzr.min.js\"></script>\n    <script src=\"main.js\"></script>\n  </body>\n</html>\n    "),
      el('p', 'main.js:'),
      el('code-js', "\nvar el = frzr.el;\nvar mount = frzr.mount;\n\nvar hello = el('Hello world!');\nmount(document.body, hello);\n"),
      el('h3', 'Easy components'),
      el('p', "It's really easy to create components with FRZR"),
      el('code-html', '...'),
      el('p', 'Work in progress...')
    ]
  };

  var content$1 = {
    hello: hello,
    features: features
  };

  var Content = function Content () {
    this.el = el('div', { class: 'content' });
  };
  Content.prototype.update = function update (section, subsection) {
    if (!content$1[section]) {
      setChildren(this.el, [
        el('404 - not found')
      ]);
      return;
    }
    var currentContent = this[section] || (this[section] = content$1[section]());

    setChildren(this.el, currentContent);
  };

  function code (lang) {
    return function (tagName, content) {
      return el('pre', { class: 'code' },
        el('code', { innerHTML: Prism.highlight(content.trim(), Prism.languages[lang]) })
      );
    }
  }

  registerElement('code-html', code('markup'));
  registerElement('code-js', code('javascript'));

  var logo = el('h1',
    el('b', 'FRZR'),
    ' - tiny view library'
  );
  var topbar = new Topbar();
  var content = new Content();

  var container = el('div', { class: 'container' },
    logo,
    topbar,
    content
  );

  logo.onclick = function () {
    location.hash = '#/hello';
  }

  api.on('section', function (section) {
    topbar.update(section);
    content.update(section);
  });

  api.trigger('section', 'hello');

  mount(document.body, container);

  window.addEventListener('hashchange', onHash);

  onHash();

  function onHash () {
    var hash = location.hash.slice(2).split('/');
    var section = hash[0];
    api.trigger('section', section);
  }

}());