# An example Backbone application contributed by
# [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
# [LocalStorage adapter](backbone-localstorage.html)
# to persist Backbone models within your browser.
# 
# This [CoffeeScript](http://jashkenas.github.com/coffee-script/) variation has been provided by [Jason Giedymin](http://jasongiedymin.com/).
#
# Note: two things you will notice with my CoffeeScript are that I prefer to
# use four space indents and prefer to use `()` for all functions.

# Load the application once the DOM is ready, using a `jQuery.ready` shortcut.
$ ->		
		### Todo Model ###

		# Our basic **Todo** model has `content`, `order`, and `done` attributes.
		class Todo extends Backbone.Model
				# Default attributes for the todo.
				defaults:
						content: "empty todo..."
						done: false
						panel: null

				# Ensure that each todo created has `content`.
				initialize: ->
						if !@get("content")
								@set({ "content": @defaults.content })

				# Toggle the `done` state of this todo item.
				toggle: ->
						@save({ done: !@get("done") })

				# Remove this Todo from *localStorage* and delete its view.
				clear: ->
						@destroy()
						@view.remove()

		class Room extends Backbone.Model
				# Default attributes for the todo.
				defaults:
						content: "empty todo..."
						done: false
						panels: []

				# Ensure that each todo created has `content`.
				initialize: ->
						if !@get("content")
								@set({ "content": @defaults.content })

				# Toggle the `done` state of this todo item.
				toggle: ->
						@save({ done: !@get("done") })

				# Remove this Todo from *localStorage* and delete its view.
				clear: ->
						@destroy()
						@view.remove()
				
				S4: ->
					(((1+Math.random())*0x10000)|0).toString(16).substring(1)
				guid: ->
					@S4()+@S4()+"-"+@S4()+"-"+@S4()+"-"+@S4()+"-"+@S4()+@S4()+@S4()
				
				addPanel: (attrs)->
					currentPanels = @get('panels')
					currentPanels.push(_.extend({id: @guid()},attrs))
					@set('panels', currentPanels)
					@save()
				
		### Todo Collection ###

		# The collection of todos is backed by *localStorage* instead of a remote
		# server.
		class TodoList extends Backbone.Collection

				# Reference to this collection's model.
				model: Todo

				# Save all of the todo items under the `"todos"` namespace.
				localStorage: new Backbone.LocalStorage("todos")

				# Attribute getter/setter
				getDone = (todo) ->
						return todo.get("done")

				# Filter down the list of all todo items that are finished.
				done: ->
						return @filter( getDone )

				# Filter down the list to only todo items that are still not finished.
				remaining: ->
						return @without.apply( this, @filter (t) ->
							t.get('panel') )

				# We keep the Todos in sequential order, despite being saved by unordered
				# GUID in the database. This generates the next order number for new items.
				nextOrder: ->
						return Math.round((new Date()).getTime() / 1000)

				# Todos are sorted by their original insertion order.
				comparator: (todo) ->
						return todo.get("order")
				
		

		class RoomList extends Backbone.Collection

				# Reference to this collection's model.
				model: Room

				# Save all of the todo items under the `"todos"` namespace.
				localStorage: new Backbone.LocalStorage("rooms")

				# Attribute getter/setter
				getDone = (todo) ->
						return todo.get("done")

				# Filter down the list of all todo items that are finished.
				done: ->
						return @filter( getDone )

				# Filter down the list to only todo items that are still not finished.
				remaining: ->
						return @without.apply( this, @done() )

				# We keep the Todos in sequential order, despite being saved by unordered
				# GUID in the database. This generates the next order number for new items.
				nextOrder: ->
						return 1 if !@length
						return @last().get('order') + 1

				# Todos are sorted by their original insertion order.
				comparator: (room) ->
						return room.get("order")

		### Todo Item View ###

		# The DOM element for a todo item...
		class TodoView extends Backbone.View

				#... is a list tag.
				tagName:	"li"

				# Cache the template function for a single item.
				template: _.template( $("#item-template").html() )

				# The DOM events specific to an item.
				events:
						"click .check"							: "toggleDone",
						"dblclick div.todo-content" : "edit",
						"click span.todo-destroy"		: "clear",
						"keypress .todo-input"			: "updateOnEnter"
						"dragstart"									: "startedDrag"
				
				# The TodoView listens for changes to its model, re-rendering. Since there's
				# a one-to-one correspondence between a **Todo** and a **TodoView** in this
				# app, we set a direct reference on the model for convenience.
				initialize: ->
						@model.bind('change', this.render);
						# @model.view = this;
						@$el.attr('draggable', 'true')

				# Re-render the contents of the todo item.
				render: =>
						# this.$(@el).html( @template(@model.toJSON()) )
						this.$el.html @template @model.toJSON()
						
						@setContent()
						return this

				# To avoid XSS (not that it would be harmful in this particular app),
				# we use `jQuery.text` to set the contents of the todo item.
				setContent: ->
						content = @model.get("content")
						this.$(".todo-content").html(Converter.makeHtml(content))
						console.log Converter.makeHtml(content)
						console.log "Something called setCon"
						@input = this.$(".todo-input");
						@input.bind("blur", @close);
						@input.val(content);

				# Toggle the `"done"` state of the model.
				toggleDone: ->
						@model.toggle()

				# Switch this view into `"editing"` mode, displaying the input field.
				edit: =>
						this.$(@el).addClass("editing")
						@input.focus()

				# Close the `"editing"` mode, saving changes to the todo.
				close: =>
						@model.save({ content: @input.val() })
						$(@el).removeClass("editing")

				# If you hit `enter`, we're through editing the item.
				updateOnEnter: (e) =>
						@close() if e.keyCode is 13

				# Remove this view from the DOM.
				remove: ->
						$(@el).remove()

				# Remove the item, destroy the model.
				clear: () ->
						$(@el).remove()
						@model.clear()

				startedDrag: (e) ->
					e = e.originalEvent if e.originalEvent?
					# e.dataTransfer.effectAllowed = "move"
					console.log "dragging note"
					e.dataTransfer.setData('text', @model.get('content'))
					# e.dataTransfer.setData('application/json', {"type": "note", "id": @model.id})
					# So, this doesn't work in Chrome, so we'll just pass stuff around using the window
					
					window._dragData = @model

		class RoomView extends Backbone.View

				#... is a list tag.
				tagName:	"div"

				# Cache the template function for a single item.
				# template: _.template( $('#room-template').html() )

				# The DOM events specific to an item.
				events:
						"keypress  .panel-input": "createPanelOnEnter"
						"click .addPanel"						: "askPanelName"
						"drop .panel"								: "handleDrop"
						"dragenter .panel"					: "handleDragHover"
						"dragover .panel"						:	"handleDragHover"
						"dragleave .panel"					: "handleDragBlur"

				template: _.template $('#room-detail-template').html()

				initialize: ->
						@model.bind('change', @render);
						# @$el.attr('draggable', 'true')
				
				placeholderPanelTemplate: _.template( $("#panel-placeholder-template").html() )
				panelTemplate: _.template( $("#panel-template").html() )

				# Re-render the contents of the todo item.
				render: =>
						# this.$(@el).html( @template(@model.toJSON()) )
						# this.$el.html @template @model.toJSON()
						this.$el.empty()
						nextToAssign = 1
						_.each @model.get('panels'), (panel) =>
							if panel['order'] is nextToAssign
								console.log "Assigning #{panel['name']} to #{nextToAssign}"
								@renderPanel(panel)							
								nextToAssign++
							else
								while (nextToAssign) < panel['order']
									this.$el.append @placeholderPanelTemplate()
									nextToAssign++
								@renderPanel(panel)
								nextToAssign++
						@createAddButtons()
						return this
				
				renderPanel: (panel) =>
					notes = Todos.filter (todo) ->
						todo.get('panel') is panel['id']

					rendered = this.$el.append @panelTemplate(panel)
					
					views = []
					for note in notes
						view = new TodoView model: note
						this.$el.find("##{panel['id']}").append(view.render().el)
				
				
				createAddButtons: () =>
					maxAllowed = 6
					howMany = maxAllowed - this.$('.panel').length
					console.log "I promise to create #{howMany} add buttons"
					while howMany > 0
						this.$el.append @placeholderPanelTemplate()
						howMany--


				# Close the `"editing"` mode, saving changes to the todo.
				close: =>
						@model.save({ content: @input.val() })
						$(@el).removeClass("editing")


				startedDrag: (e) ->
					e = e.originalEvent if e.originalEvent?
					e.dataTransfer.effectAllowed = "move"
					console.log "drag started"
					
				# showRoom: (e) ->
				# 	$('#room-list').hide(500).empty()
				# 	@showPanels()
				# 	@renderRoomNotes()
				# showPanels: () ->
				# 	maxPanels = 6
				# 	el =	$('#panel-list') 
				# 	while maxPanels > 0
				# 		el.append(@placeholderPanelTemplate()).show()
				# 		maxPanels--
				
				askPanelName: (e) ->
					p = $(e.target).parent()
					p.find('.edit').show()
					p.find('.addPanel').hide()
					# Rooms.create({name: "room", order: Rooms.nextOrder(), done: false})
					# console.log Rooms
					return false

				createPanelOnEnter: (e) ->
					return if e.keyCode isnt 13
					@model.addPanel {name: $(e.target).val(), order: $(e.target).parent().parent().index() + 1}
					@model.trigger('change')
					return false
					
				renderRoomNotes: () ->
					console.log "dropped"					
				handleDragHover: (e) ->
					e = e.originalEvent if e.originalEvent
					e.preventDefault() if e.preventDefault
					e.dataTransfer.dropEffect  = "move"
					$(e.targetElement).addClass('hover')
					return false				
				handleDragBlur: () ->
					console.log "leaving"					
				handleDrop: (e) ->
					e = e.originalEvent if e.originalEvent?
					e.stopPropogation() if e.stopPropogation
					
					model = window._dragData #Wish there was a quick way to confirm what we are getting.
					
					olPanel =	model.get('panel')
					newPanel =  $(e.target).attr "data-uuid"
					unless newPanel?
						newPanel = $(e.target).parents('.panel').first().attr('data-uuid')
						
					model.set('panel', newPanel)
					model.save()
					
					@model.trigger('change')
					return false

		class RoomListView extends Backbone.View

				#... is a list tag.
				tagName:	"div"

				# Cache the template function for a single item.
				# template: _.template( $('#room-template').html() )

				# The DOM events specific to an item.
				events:
						"click": "loadDetailView"

				template: _.template( $("#room-template").html() )
				# The TodoView listens for changes to its model, re-rendering. Since there's
				# a one-to-one correspondence between a **Todo** and a **TodoView** in this
				# app, we set a direct reference on the model for convenience.
				initialize: ->
						@model.bind('change', this.render);
						@model.view = this;
						# @$el.attr('draggable', 'true')
				
				
				# Re-render the contents of the todo item.
				render: =>
						this.$el.html @template @model.toJSON()
						return this

				startedDrag: (e) ->
					e = e.originalEvent if e.originalEvent?
					e.dataTransfer.effectAllowed = "move"
					console.log "drag started"

				loadDetailView: (e) ->
					$('#room-list').hide(500).empty()
					view = new RoomView model: @model
					$('#panel-list').html view.render().$el
					console.log "rendering details done"
					
		### The Application ###

		# Our overall **AppView** is the top-level piece of UI.
		class AppView extends Backbone.View
				# Instead of generating a new element, bind to the existing skeleton of
				# the App already present in the HTML.
				el_tag = "#todoapp"
				el: $(el_tag)

				# Our template for the line of statistics at the bottom of the app.
				statsTemplate: _.template( $("#stats-template").html() )
				roomPlaceholderTemplate: _.template( $("#room-placeholder-template").html() )
				roomTemplate: _.template( $("#room-template").html() )
				# Delegated events for creating new items, and clearing completed ones.
				events:
						"keypress #new-todo"	: "createOnEnter",
						"keypress .room-input"	: "createRoomOnEnter",
						"keyup #new-todo"			: "showTooltip",
						"click .todo-clear a" : "clearCompleted"
						"click .addRoom"			: "addRoom"
				# At initialization we bind to the relevant events on the `Todos`
				# collection, when items are added or changed. Kick things off by
				# loading any preexisting todos that might be saved in *localStorage*.
				initialize: =>
						@input = this.$("#new-todo")

						Todos.bind("add", @addOne)
						Todos.bind("reset", @addAll)
						Todos.bind("all", @render)
						
						Rooms.bind "reset", @addAllRooms
						# Todos.bind "add", @addAllRooms
						Rooms.bind "all", @addAllRooms

						Todos.fetch()
						Rooms.fetch()

				# Rerendering the app means we show all the rooms, and then the statistics etc
				render: =>
						x = Todos.length
						barLength = 0.01*x*x - 2*x + 100
						this.$('#todo-stats').html( @statsTemplate({
								total:			Todos.length,
								done:				Todos.done().length,
								remaining:	Todos.remaining().length
								barLength: barLength
						}))
						
						@addAllRooms()
						
						
						

				# Add a single todo item to the list by creating a view for it, and
				# appending its element to the `<ul>`.
				addOne: (todo) =>
						view = new TodoView( {model: todo} )
						this.$("#todo-list").prepend( view.render().el )

				# Add all items in the **Todos** collection at once.
				addAll: =>
						uncategorized = Todos.filter (t) ->
							!t.get('panel')?
						_.each uncategorized, @addOne
				
				addOneRoom: (room) =>
					view = new RoomListView model: room
					this.$('#room-list').append view.render().el
					
				addAllRooms: (rooms) =>
					this.$('#room-list').empty()
					nextToAssign = 1
					Rooms.each (room) =>
						
						if room.get('order') is nextToAssign
							console.log "Assigning #{room.get('name')} to #{nextToAssign}"
							@addOneRoom room
							nextToAssign++
						else
							while (nextToAssign) < room.get('order')
								console.log nextToAssign, room.get('order'), room.get('name')
								this.$('#room-list').append @roomPlaceholderTemplate()
								nextToAssign++
							@addOneRoom room
							nextToAssign++
					@createAddButtons()

				createAddButtons: () =>
					maxAllowed = 9
					howMany = maxAllowed - this.$('.room').length
					console.log "I promise to create #{howMany} add buttons"
					while howMany > 0
						this.$('#room-list').append @roomPlaceholderTemplate()
						howMany--
				
				# Generate the attributes for a new Todo item.
				newAttributes: ->
						return {
								content: @input.val(),
								order:	 Todos.nextOrder(),
								done:		 false
						}

				# If you hit return in the main input field, create new **Todo** model,
				# persisting it to *localStorage*.
				createOnEnter: (e) ->
						return if (e.keyCode != 13)
						Todos.create( @newAttributes() )
						@input.val('')
						@input.focus()
						return false

				# Clear all done todo items, destroying their models.
				clearCompleted: ->
						_.each(Todos.done(), (todo) ->
								todo.clear()
						)
						return false

				# Lazily show the tooltip that tells you to press `enter` to save
				# a new todo item, after one second.
				showTooltip: (e) ->
						tooltip = this.$(".ui-tooltip-top")
						val = @input.val()
						tooltip.fadeOut()
						clearTimeout(@tooltipTimeout) if (@tooltipTimeout)
						return if (val is '' || val is @input.attr("placeholder"))
						el = @input
						show = () ->
								tooltip.show().fadeIn() if el.is(':focus')
						@tooltipTimeout = _.delay(show, 1000)
				addRoom: (e) ->
					p = $(e.target).parent()
					p.find('.edit').show()
					p.find('.addRoom').hide()
					# Rooms.create({name: "room", order: Rooms.nextOrder(), done: false})
					# console.log Rooms
					return false
					
				createRoomOnEnter: (e) ->
					return if e.keyCode isnt 13
					Rooms.create {name: $(e.target).val(), order: $(e.target).parent().parent().index() + 1, done: false}

					
					

		# Create our global collection of **Todos**.
		# Note: I've actually chosen not to export globally to `window`.
		# Original documentation has been left intact.
		Converter = new Markdown.Converter()
		Todos = new TodoList
		Rooms = new RoomList
		App = new AppView()

		

