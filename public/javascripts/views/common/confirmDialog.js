/**
 *	View: Confirm Dialog
 */
 define([], function () {

 	var ConfirmDialog = Backbone.View.extend({

 		// fields.
 		message: '',
 		yesButtonLabel: 'OK',
 		noButtonLabel: 'Cancel',
 		yesButtonCallback: function () {},
 		noButtonCallback: function () {},


 		initialize: function () {

 			// auto event bind.
 			_.bindEvents(this);

 			// bind.
 			_.bindAll(this, 'show', 'render', 'close', 'dealloc');
 		},


 		render: function () {
 			var snipet = _.mbTemplate('confirmDialog', this);
 			this.$el.html(snipet);
 			$('body').append(this.$el);
 		},


 		yesAction: function () {
 			this.yesButtonCallback();
 			this.close();
 		},


 		noAction: function () {
 			this.noButtonCallback();
 			this.close();
 		},


 		show: function (options) {

 			// set data.
 			this.message = options.message || this.message;
 			this.yesButtonLabel = options.yesButtonLabel || this.yesButtonLabel;
 			this.noButtonLabel = options.noButtonLabel || this.noButtonLabel;
 			this.yesButtonCallback = options.yesButtonCallback || this.yesButtonCallback;
 			this.noButtonCallback = options.noButtonCallback || this.noButtonCallback;

 			// reder.
 			this.render();

 		},


 		close: function () {

 			var self = this;
 			this.$el.transit({opacity: 0}, 200, function () {
 				self.dealloc();
 			});
 		},


 		dealloc: function () {
 			this.$el.remove();
 		},

 	});

 	return ConfirmDialog;
 });