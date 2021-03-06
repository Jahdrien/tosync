import { Template } from 'meteor/templating'
import './loginStatusBar.html'
import _ from 'lodash'
import Modals from '/imports/api/client/Modals.js'
import * as Ladda from 'ladda'

Template.loginStatusBar.helpers({
  userProfile() {
    return _.get(Meteor.user(), 'profile')
  },

  signNeeded() {
    return Connect.signNeeded()
  },

  changesPending() {
    return Connect.changesPending()
  },

  syncAvailable() {
    return !Connect.signNeeded() && !Connect.changesPending()
  },

  onSignClick() {
    return (doneCb) => {
      App.requestPlanningSign().finally(doneCb)
    }
  },

  bases() {
    return ['ORY','LYS','MPL','NTE']
  },

  selectedBase(base) {
    return base === Config.get('base') ? 'selected' : ''
  }
})

Template.loginStatusBar.events({
	'click button.logout': function (e,t) {
		Meteor.logout(function (error) {
			if (error) App.error(error)
		})
	},

  'click button.js-validateChanges': function (e,t) {
		Modals.Changes.open()
	},

  'submit form#login': async (e,t) => {
		e.preventDefault()

		const username = t.$('input[name=login]').val().toUpperCase()
    const pw = t.$('input[name=password]').val()

		if (username.length !== 3) {
			Notify.warn('Identifiant invalide !')
			return
		}

    if (!pw.length) {
      Notify.warn("Vous n'avez pas tapé de mot de passe.")
			return
    }

		const l = Ladda.create(t.find('button.login')).start()

		await Connect.login(username, pw)
		l.stop()
		t.$('input[type=password]').val('')

		return false
	},

  'change select#baseSelect': (e,t) => {
    if (e.currentTarget.value && e.currentTarget.value.length === 3) {
      Config.set('base', e.currentTarget.value)
    } else {
      Config.set('base', null)
    }
  }

})

/*** connectButton ***/
Template.connectButton.onDestroyed(function () {
  if (this.laddaComp) this.laddaComp.stop()
})

Template.connectButton.helpers({

})

Template.connectButton.events({
	'click button': function (e,t) {
    if (!t.laddaComp) {
      const l = Ladda.create(e.currentTarget)
      Tracker.autorun(c => {
    		if (!t.laddaComp) t.laddaComp = c
    		if (Connect.running()) {
          l.start()
    		} else {
      		l.stop()
    		}
    	})
    }
		App.sync()
	}
})
