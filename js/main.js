BUILD_STATE_CLASSES = {
  'Passed': 'build-passed',
  'Building': 'build-building',
  'Failed': 'build-failed'
};

DEFAULT_FONT_SIZE = '30px';

function buildGroup(group) {
  $( "#pipeline-groups" ).append( pipeline_group_template( { name: group.name } ))

  $.each( group._embedded.pipelines, function(i , pipeline) {
    if ( pipeline._embedded.instances[0] ) {
      stage_states = _.pluck(pipeline._embedded.instances[0]._embedded.stages, 'status')
      stage_state_classes = stage_states.map(function(a) {return BUILD_STATE_CLASSES[a]});
    }
    pipeline_details = {
      name: pipeline.name,
      link: server + '/go/tab/pipeline/history/' + pipeline.name,
      multistage: stage_state_classes.length > 1,
      paused: pipeline.pause_info.paused,
      stage_status_classes: stage_state_classes,
      badge_class: BUILD_STATE_CLASSES[pipeline._embedded.instances[0]._embedded.stages[0].status] || 'build-none'
    }
    if ( !pipeline.pause_info.paused || !final_config.hide_paused_pipelines ) {
      $( "#pipeline-group-" + group.name ).append( pipeline_badge_template( pipeline_details ))
    }
  });
}

function queryParse(querystring) {
  var result = {};
  (querystring || '').replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) {
          result[$1] = $3 !== undefined ? decodeURIComponent($3) : $3;
      }
  );
  return result;
}

function mergeConfig(query) {
  server = query.server ? _.trim(query.server, '/' ) : _.trim(config.server, '/' );

  if ( query.pipeline_groups ) {
    pipeline_groups =  _.trim(query.pipeline_groups, '/' )
  } else {
    pipeline_groups = config.pipeline_groups ? config.pipeline_groups : null
  }

  hide_paused_pipelines = query.hide_paused_pipelines ? query.hide_paused_pipelines : config.hide_paused_pipelines

  requested_font_size = query.font_size ? query.font_size : config.font_size ? config.font_size : DEFAULT_FONT_SIZE

  return {
    server: server,
    pipeline_groups: pipeline_groups,
    hide_paused_pipelines: hide_paused_pipelines,
    font_size: requested_font_size
  }
}

function showError( html ) {
  $( '#error-text' ).append( html + '<br>');
  $( '#error-panel' ).show();
}


// Main execution

query = queryParse( window.location.search );
final_config = mergeConfig(query);

console.log(final_config);

// Override global text size from config
// http://stackoverflow.com/questions/566203/changing-css-values-with-javascript
var cssRuleCode = document.all ? 'rules' : 'cssRules'; //account for IE and FF
// these indices may change if we add a new stylesheet or new rules to the existing CSS
var text_size_rule = document.styleSheets[2][cssRuleCode][1];
text_size_rule.style.fontSize = final_config.font_size;

groups = final_config.pipeline_groups !== null ? final_config.pipeline_groups.split(',') : null

pipeline_group_template = Handlebars.compile( $("#pipeline-group-template").html() );
pipeline_badge_template = Handlebars.compile( $("#pipeline-badge-template").html() );

url = final_config.server + "/go/api/dashboard"

$.ajax({
  dataType: "json",
  url: url,
  timeout: 10000,
  headers: {
    Accept : "application/vnd.go.cd.v1+json"
  }
}).done(function( data ) {
  if ( groups !== undefined && groups !== null ) {
    $.each( groups, function(i , group) {
      group_object = _.find(data._embedded.pipeline_groups, { 'name': group } )
      if ( typeof group_object !== 'undefined' ) {
        buildGroup( group_object );
      } else {
        showError( "Pipeline group '" + group + "' was not found in the data returned from " + url );
      }
    });
  } else {
    $.each( data._embedded.pipeline_groups, function(i , val) {
      buildGroup(val);
    });
  };
}).fail(function( jqxhr, textStatus, error ) {
  error_html = "Unable to fetch data from " + url
  if ( error ) {
    error_html = error_html + "<br>Error: " + error
  }
  showError( error_html );
});
