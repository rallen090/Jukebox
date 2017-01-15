import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
 
import './search.html';

Template.search.onCreated(function bodyOnCreated() {
});

Template.search.onRendered(function createPageOnRendered() {
  	$('.ui.search')
  .search({
    apiSettings: {
      url: '//api.github.com/search/repositories?q={query}'
    },
    fields: {
      results : 'items',
      title   : 'name',
      url     : 'html_url'
    },
    minCharacters : 3
  })
;

  this.autorun(() => {
  });
});

Template.search.helpers({
});

Template.search.events({
});