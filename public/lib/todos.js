(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {
    /* Todo Model
    */
    var App, AppView, Converter, Room, RoomList, RoomListView, RoomView, Rooms, Todo, TodoList, TodoView, Todos;
    Todo = (function() {

      __extends(Todo, Backbone.Model);

      function Todo() {
        Todo.__super__.constructor.apply(this, arguments);
      }

      Todo.prototype.defaults = {
        content: "empty todo...",
        done: false,
        panel: null
      };

      Todo.prototype.initialize = function() {
        if (!this.get("content")) {
          return this.set({
            "content": this.defaults.content
          });
        }
      };

      Todo.prototype.toggle = function() {
        return this.save({
          done: !this.get("done")
        });
      };

      Todo.prototype.clear = function() {
        this.destroy();
        return this.view.remove();
      };

      return Todo;

    })();
    Room = (function() {

      __extends(Room, Backbone.Model);

      function Room() {
        Room.__super__.constructor.apply(this, arguments);
      }

      Room.prototype.defaults = {
        content: "empty todo...",
        done: false,
        panels: []
      };

      Room.prototype.initialize = function() {
        if (!this.get("content")) {
          return this.set({
            "content": this.defaults.content
          });
        }
      };

      Room.prototype.toggle = function() {
        return this.save({
          done: !this.get("done")
        });
      };

      Room.prototype.clear = function() {
        this.destroy();
        return this.view.remove();
      };

      Room.prototype.S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };

      Room.prototype.guid = function() {
        return this.S4() + this.S4() + "-" + this.S4() + "-" + this.S4() + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4();
      };

      Room.prototype.addPanel = function(attrs) {
        var currentPanels;
        currentPanels = this.get('panels');
        currentPanels.push(_.extend({
          id: this.guid()
        }, attrs));
        this.set('panels', currentPanels);
        return this.save();
      };

      return Room;

    })();
    /* Todo Collection
    */
    TodoList = (function() {
      var getDone;

      __extends(TodoList, Backbone.Collection);

      function TodoList() {
        TodoList.__super__.constructor.apply(this, arguments);
      }

      TodoList.prototype.model = Todo;

      TodoList.prototype.localStorage = new Backbone.LocalStorage("todos");

      getDone = function(todo) {
        return todo.get("done");
      };

      TodoList.prototype.done = function() {
        return this.filter(getDone);
      };

      TodoList.prototype.remaining = function() {
        return this.without.apply(this, this.filter(function(t) {
          return t.get('panel');
        }));
      };

      TodoList.prototype.nextOrder = function() {
        return Math.round((new Date()).getTime() / 1000);
      };

      TodoList.prototype.comparator = function(todo) {
        return todo.get("order");
      };

      return TodoList;

    })();
    RoomList = (function() {
      var getDone;

      __extends(RoomList, Backbone.Collection);

      function RoomList() {
        RoomList.__super__.constructor.apply(this, arguments);
      }

      RoomList.prototype.model = Room;

      RoomList.prototype.localStorage = new Backbone.LocalStorage("rooms");

      getDone = function(todo) {
        return todo.get("done");
      };

      RoomList.prototype.done = function() {
        return this.filter(getDone);
      };

      RoomList.prototype.remaining = function() {
        return this.without.apply(this, this.done());
      };

      RoomList.prototype.nextOrder = function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
      };

      RoomList.prototype.comparator = function(room) {
        return room.get("order");
      };

      return RoomList;

    })();
    /* Todo Item View
    */
    TodoView = (function() {

      __extends(TodoView, Backbone.View);

      function TodoView() {
        this.updateOnEnter = __bind(this.updateOnEnter, this);
        this.close = __bind(this.close, this);
        this.edit = __bind(this.edit, this);
        this.render = __bind(this.render, this);
        TodoView.__super__.constructor.apply(this, arguments);
      }

      TodoView.prototype.tagName = "li";

      TodoView.prototype.template = _.template($("#item-template").html());

      TodoView.prototype.events = {
        "click .check": "toggleDone",
        "dblclick div.todo-content": "edit",
        "click span.todo-destroy": "clear",
        "keypress .todo-input": "updateOnEnter",
        "dragstart": "startedDrag"
      };

      TodoView.prototype.initialize = function() {
        this.model.bind('change', this.render);
        return this.$el.attr('draggable', 'true');
      };

      TodoView.prototype.render = function() {
        this.$el.html(this.template(this.model.toJSON()));
        this.setContent();
        return this;
      };

      TodoView.prototype.setContent = function() {
        var content;
        content = this.model.get("content");
        this.$(".todo-content").html(Converter.makeHtml(content));
        console.log(Converter.makeHtml(content));
        console.log("Something called setCon");
        this.input = this.$(".todo-input");
        this.input.bind("blur", this.close);
        return this.input.val(content);
      };

      TodoView.prototype.toggleDone = function() {
        return this.model.toggle();
      };

      TodoView.prototype.edit = function() {
        this.$(this.el).addClass("editing");
        return this.input.focus();
      };

      TodoView.prototype.close = function() {
        this.model.save({
          content: this.input.val()
        });
        return $(this.el).removeClass("editing");
      };

      TodoView.prototype.updateOnEnter = function(e) {
        if (e.keyCode === 13) return this.close();
      };

      TodoView.prototype.remove = function() {
        return $(this.el).remove();
      };

      TodoView.prototype.clear = function() {
        $(this.el).remove();
        return this.model.clear();
      };

      TodoView.prototype.startedDrag = function(e) {
        if (e.originalEvent != null) e = e.originalEvent;
        console.log("dragging note");
        e.dataTransfer.setData('text', this.model.get('content'));
        return window._dragData = this.model;
      };

      return TodoView;

    })();
    RoomView = (function() {

      __extends(RoomView, Backbone.View);

      function RoomView() {
        this.close = __bind(this.close, this);
        this.createAddButtons = __bind(this.createAddButtons, this);
        this.renderPanel = __bind(this.renderPanel, this);
        this.render = __bind(this.render, this);
        RoomView.__super__.constructor.apply(this, arguments);
      }

      RoomView.prototype.tagName = "div";

      RoomView.prototype.events = {
        "keypress  .panel-input": "createPanelOnEnter",
        "click .addPanel": "askPanelName",
        "drop .panel": "handleDrop",
        "dragenter .panel": "handleDragHover",
        "dragover .panel": "handleDragHover",
        "dragleave .panel": "handleDragBlur"
      };

      RoomView.prototype.template = _.template($('#room-detail-template').html());

      RoomView.prototype.initialize = function() {
        return this.model.bind('change', this.render);
      };

      RoomView.prototype.placeholderPanelTemplate = _.template($("#panel-placeholder-template").html());

      RoomView.prototype.panelTemplate = _.template($("#panel-template").html());

      RoomView.prototype.render = function() {
        var nextToAssign;
        var _this = this;
        this.$el.empty();
        nextToAssign = 1;
        _.each(this.model.get('panels'), function(panel) {
          if (panel['order'] === nextToAssign) {
            console.log("Assigning " + panel['name'] + " to " + nextToAssign);
            _this.renderPanel(panel);
            return nextToAssign++;
          } else {
            while (nextToAssign < panel['order']) {
              _this.$el.append(_this.placeholderPanelTemplate());
              nextToAssign++;
            }
            _this.renderPanel(panel);
            return nextToAssign++;
          }
        });
        this.createAddButtons();
        return this;
      };

      RoomView.prototype.renderPanel = function(panel) {
        var note, notes, rendered, view, views, _i, _len, _results;
        notes = Todos.filter(function(todo) {
          return todo.get('panel') === panel['id'];
        });
        rendered = this.$el.append(this.panelTemplate(panel));
        views = [];
        _results = [];
        for (_i = 0, _len = notes.length; _i < _len; _i++) {
          note = notes[_i];
          view = new TodoView({
            model: note
          });
          _results.push(this.$el.find("#" + panel['id']).append(view.render().el));
        }
        return _results;
      };

      RoomView.prototype.createAddButtons = function() {
        var howMany, maxAllowed, _results;
        maxAllowed = 6;
        howMany = maxAllowed - this.$('.panel').length;
        console.log("I promise to create " + howMany + " add buttons");
        _results = [];
        while (howMany > 0) {
          this.$el.append(this.placeholderPanelTemplate());
          _results.push(howMany--);
        }
        return _results;
      };

      RoomView.prototype.close = function() {
        this.model.save({
          content: this.input.val()
        });
        return $(this.el).removeClass("editing");
      };

      RoomView.prototype.startedDrag = function(e) {
        if (e.originalEvent != null) e = e.originalEvent;
        e.dataTransfer.effectAllowed = "move";
        return console.log("drag started");
      };

      RoomView.prototype.askPanelName = function(e) {
        var p;
        p = $(e.target).parent();
        p.find('.edit').show();
        p.find('.addPanel').hide();
        return false;
      };

      RoomView.prototype.createPanelOnEnter = function(e) {
        if (e.keyCode !== 13) return;
        this.model.addPanel({
          name: $(e.target).val(),
          order: $(e.target).parent().parent().index() + 1
        });
        this.model.trigger('change');
        return false;
      };

      RoomView.prototype.renderRoomNotes = function() {
        return console.log("dropped");
      };

      RoomView.prototype.handleDragHover = function(e) {
        if (e.originalEvent) e = e.originalEvent;
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        $(e.targetElement).addClass('hover');
        return false;
      };

      RoomView.prototype.handleDragBlur = function() {
        return console.log("leaving");
      };

      RoomView.prototype.handleDrop = function(e) {
        var model, newPanel, olPanel;
        if (e.originalEvent != null) e = e.originalEvent;
        if (e.stopPropogation) e.stopPropogation();
        model = window._dragData;
        olPanel = model.get('panel');
        newPanel = $(e.target).attr("data-uuid");
        if (newPanel == null) {
          newPanel = $(e.target).parents('.panel').first().attr('data-uuid');
        }
        model.set('panel', newPanel);
        model.save();
        this.model.trigger('change');
        return false;
      };

      return RoomView;

    })();
    RoomListView = (function() {

      __extends(RoomListView, Backbone.View);

      function RoomListView() {
        this.render = __bind(this.render, this);
        RoomListView.__super__.constructor.apply(this, arguments);
      }

      RoomListView.prototype.tagName = "div";

      RoomListView.prototype.events = {
        "click": "loadDetailView"
      };

      RoomListView.prototype.template = _.template($("#room-template").html());

      RoomListView.prototype.initialize = function() {
        this.model.bind('change', this.render);
        return this.model.view = this;
      };

      RoomListView.prototype.render = function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
      };

      RoomListView.prototype.startedDrag = function(e) {
        if (e.originalEvent != null) e = e.originalEvent;
        e.dataTransfer.effectAllowed = "move";
        return console.log("drag started");
      };

      RoomListView.prototype.loadDetailView = function(e) {
        var view;
        $('#room-list').hide(500).empty();
        view = new RoomView({
          model: this.model
        });
        $('#panel-list').show().html(view.render().$el);
        return console.log("rendering details done");
      };

      return RoomListView;

    })();
    /* The Application
    */
    AppView = (function() {
      var el_tag;

      __extends(AppView, Backbone.View);

      function AppView() {
        this.createAddButtons = __bind(this.createAddButtons, this);
        this.addAllRooms = __bind(this.addAllRooms, this);
        this.addOneRoom = __bind(this.addOneRoom, this);
        this.addAll = __bind(this.addAll, this);
        this.addOne = __bind(this.addOne, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        AppView.__super__.constructor.apply(this, arguments);
      }

      el_tag = "#todoapp";

      AppView.prototype.el = $(el_tag);

      AppView.prototype.statsTemplate = _.template($("#stats-template").html());

      AppView.prototype.roomPlaceholderTemplate = _.template($("#room-placeholder-template").html());

      AppView.prototype.roomTemplate = _.template($("#room-template").html());

      AppView.prototype.events = {
        "keypress #new-todo": "createOnEnter",
        "keypress .room-input": "createRoomOnEnter",
        "keyup #new-todo": "showTooltip",
        "click .todo-clear a": "clearCompleted",
        "click .addRoom": "addRoom",
        "click #app-title": "goHome"
      };

      AppView.prototype.initialize = function() {
        this.input = this.$("#new-todo");
        Todos.bind("add", this.addOne);
        Todos.bind("reset", this.addAll);
        Todos.bind("all", this.render);
        Rooms.bind("reset", this.addAllRooms);
        Rooms.bind("all", this.addAllRooms);
        Todos.fetch();
        return Rooms.fetch();
      };

      AppView.prototype.render = function() {
        var barLength, x;
        x = Todos.length;
        barLength = 0.01 * x * x - 2 * x + 100;
        this.$('#todo-stats').html(this.statsTemplate({
          total: Todos.length,
          done: Todos.done().length,
          remaining: Todos.remaining().length,
          barLength: barLength
        }));
        return this.addAllRooms();
      };

      AppView.prototype.addOne = function(todo) {
        var view;
        view = new TodoView({
          model: todo
        });
        return this.$("#todo-list").prepend(view.render().el);
      };

      AppView.prototype.addAll = function() {
        var uncategorized;
        uncategorized = Todos.filter(function(t) {
          return !(t.get('panel') != null);
        });
        return _.each(uncategorized, this.addOne);
      };

      AppView.prototype.addOneRoom = function(room) {
        var view;
        view = new RoomListView({
          model: room
        });
        return this.$('#room-list').append(view.render().el);
      };

      AppView.prototype.addAllRooms = function(rooms) {
        var nextToAssign;
        var _this = this;
        this.$('#room-list').empty();
        nextToAssign = 1;
        Rooms.each(function(room) {
          if (room.get('order') === nextToAssign) {
            console.log("Assigning " + (room.get('name')) + " to " + nextToAssign);
            _this.addOneRoom(room);
            return nextToAssign++;
          } else {
            while (nextToAssign < room.get('order')) {
              console.log(nextToAssign, room.get('order'), room.get('name'));
              _this.$('#room-list').append(_this.roomPlaceholderTemplate());
              nextToAssign++;
            }
            _this.addOneRoom(room);
            return nextToAssign++;
          }
        });
        return this.createAddButtons();
      };

      AppView.prototype.createAddButtons = function() {
        var howMany, maxAllowed, _results;
        maxAllowed = 9;
        howMany = maxAllowed - this.$('.room').length;
        console.log("I promise to create " + howMany + " add buttons");
        _results = [];
        while (howMany > 0) {
          this.$('#room-list').append(this.roomPlaceholderTemplate());
          _results.push(howMany--);
        }
        return _results;
      };

      AppView.prototype.newAttributes = function() {
        return {
          content: this.input.val(),
          order: Todos.nextOrder(),
          done: false
        };
      };

      AppView.prototype.createOnEnter = function(e) {
        if (e.keyCode !== 13) return;
        Todos.create(this.newAttributes());
        this.input.val('');
        this.input.focus();
        return false;
      };

      AppView.prototype.clearCompleted = function() {
        _.each(Todos.done(), function(todo) {
          return todo.clear();
        });
        return false;
      };

      AppView.prototype.showTooltip = function(e) {
        var el, show, tooltip, val;
        tooltip = this.$(".ui-tooltip-top");
        val = this.input.val();
        tooltip.fadeOut();
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
        if (val === '' || val === this.input.attr("placeholder")) return;
        el = this.input;
        show = function() {
          if (el.is(':focus')) return tooltip.show().fadeIn();
        };
        return this.tooltipTimeout = _.delay(show, 1000);
      };

      AppView.prototype.addRoom = function(e) {
        var p;
        p = $(e.target).parent();
        p.find('.edit').show();
        p.find('.addRoom').hide();
        return false;
      };

      AppView.prototype.createRoomOnEnter = function(e) {
        if (e.keyCode !== 13) return;
        return Rooms.create({
          name: $(e.target).val(),
          order: $(e.target).parent().parent().index() + 1,
          done: false
        });
      };

      AppView.prototype.goHome = function() {
        this.$('#room-list').show();
        this.$('#panel-list').hide();
        this.render();
        return false;
      };

      return AppView;

    })();
    Converter = new Markdown.Converter();
    Todos = new TodoList;
    Rooms = new RoomList;
    return App = new AppView();
  });

}).call(this);
