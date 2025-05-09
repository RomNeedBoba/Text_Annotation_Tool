var VIA_VERSION      = '2.0.10';
var VIA_NAME         = 'VGG Image Annotator';
var VIA_SHORT_NAME   = 'VIA';
var VIA_REGION_SHAPE = { RECT:'rect',
                         POLYGON:'polygon',
                       };

var VIA_ATTRIBUTE_TYPE = { TEXT:'text',
                         };

var VIA_DISPLAY_AREA_CONTENT_NAME = {IMAGE:'image_panel',
                                     IMAGE_GRID:'image_grid_panel',
                                     SETTINGS:'settings_panel',
                                     PAGE_404:'page_404',
                                     PAGE_GETTING_STARTED:'page_getting_started',
                                     PAGE_ABOUT:'page_about',
                                     PAGE_START_INFO:'page_start_info',
                                     PAGE_LICENSE:'page_license'
                                    };

var VIA_ANNOTATION_EDITOR_MODE    = {SINGLE_REGION:'single_region',
                                     ALL_REGIONS:'all_regions'};
var VIA_ANNOTATION_EDITOR_PLACEMENT = {NEAR_REGION:'NEAR_REGION',
                                       IMAGE_BOTTOM:'IMAGE_BOTTOM',
                                       DISABLE:'DISABLE'};

var VIA_REGION_EDGE_TOL           = 5;   // pixel
var VIA_REGION_CONTROL_POINT_SIZE = 2;
var VIA_POLYGON_VERTEX_MATCH_TOL  = 5;
var VIA_REGION_MIN_DIM            = 3;
var VIA_MOUSE_CLICK_TOL           = 2;
var VIA_ELLIPSE_EDGE_TOL          = 0.2; // euclidean distance
var VIA_THETA_TOL                 = Math.PI/18; // 10 degrees
var VIA_POLYGON_RESIZE_VERTEX_OFFSET  = 100;
var VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX = 3;
var VIA_CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4, 5, 6, 7, 8, 9, 10];
var VIA_REGION_COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#D55E00", "#CC79A7", "#F0E442", "#ffffff"];
// radius of control points in all shapes
var VIA_REGION_SHAPES_POINTS_RADIUS = 3;
// radius of control points in a point
var VIA_REGION_POINT_RADIUS         = 3;
var VIA_REGION_POINT_RADIUS_DEFAULT = 3;

var VIA_THEME_REGION_BOUNDARY_WIDTH = 3;
var VIA_THEME_BOUNDARY_LINE_COLOR   = "black";
var VIA_THEME_BOUNDARY_FILL_COLOR   = "#E6E6FA"; // Lavender, a very light purple
var VIA_THEME_SEL_REGION_FILL_COLOR = "#F8F8FF"; // GhostWhite, an even lighter shade
var VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR = "6EACDA";
var VIA_THEME_SEL_REGION_OPACITY    = 0.5;
var VIA_THEME_MESSAGE_TIMEOUT_MS    = 2000;
var VIA_THEME_CONTROL_POINT_COLOR   = '#ff0000';
// Updated show_message function to display messages in a styled box at the top-right corner
function show_message(msg, t) {
  if (_via_message_clear_timer) {
    clearTimeout(_via_message_clear_timer); // stop any previous timeouts
  }

  var timeout = t || VIA_THEME_MESSAGE_TIMEOUT_MS;

  // Create or update the message panel
  var messagePanel = document.getElementById('message_panel');
  if (!messagePanel) {
    messagePanel = document.createElement('div');
    messagePanel.id = 'message_panel';
    messagePanel.style.position = 'fixed';
    messagePanel.style.top = '10px';
    messagePanel.style.right = '10px';
    messagePanel.style.zIndex = '1000';
    messagePanel.style.padding = '10px';
    messagePanel.style.border = '2px solid #000';
    messagePanel.style.borderRadius = '5px';
    messagePanel.style.backgroundColor = '#f9f9f9';
    messagePanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    messagePanel.style.fontFamily = 'Arial, sans-serif';
    messagePanel.style.fontSize = '14px';
    messagePanel.style.color = '#333';
    messagePanel.style.maxWidth = '300px';
    messagePanel.style.wordWrap = 'break-word';
    messagePanel.style.cursor = 'pointer';
    messagePanel.style.textAlign = 'left'; // Ensure text aligns properly
    messagePanel.addEventListener('click', function () {
      this.style.display = 'none';
    });
    document.body.appendChild(messagePanel);
  }

  messagePanel.innerHTML = msg;
  messagePanel.style.display = 'block';

  _via_message_clear_timer = setTimeout(function () {
    messagePanel.style.display = 'none';
  }, timeout);
}

var VIA_CSV_SEP        = ',';
var VIA_CSV_QUOTE_CHAR = '"';
var VIA_CSV_KEYVAL_SEP = ':';

var _via_img_metadata = {};   // data structure to store loaded images metadata
var _via_img_src      = {};   // image content {abs. path, url, base64 data, etc}
var _via_img_fileref  = {};   // reference to local images selected by using browser file selector
var _via_img_count    = 0;    // count of the loaded images
var _via_canvas_regions = []; // image regions spec. in canvas space
var _via_canvas_scale   = 1.0;// current scale of canvas image

var _via_image_id       = ''; // id={filename+length} of current image
var _via_image_index    = -1; // index

var _via_current_image_filename;
var _via_current_image;
var _via_current_image_width;
var _via_current_image_height;

// a record of image statistics (e.g. width, height)
var _via_img_stat     = {};
var _via_is_all_img_stat_read_ongoing = false;
var _via_img_stat_current_img_index = false;

// image canvas
var _via_display_area = document.getElementById('display_area');
var _via_img_panel    = document.getElementById('image_panel');
var _via_reg_canvas   = document.getElementById('region_canvas');
var _via_reg_ctx; // initialized in _via_init()
var _via_canvas_width, _via_canvas_height;

// canvas zoom
var _via_canvas_zoom_level_index   = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX; // 1.0
var _via_canvas_scale_without_zoom = 1.0;

// state of the application
var _via_is_user_drawing_region  = false;
var _via_current_image_loaded    = false;
var _via_is_window_resized       = false;
var _via_is_user_resizing_region = false;
var _via_is_user_moving_region   = false;
var _via_is_user_drawing_polygon = false;
var _via_is_region_selected      = false;
var _via_is_all_region_selected  = false;
var _via_is_loaded_img_list_visible  = false;
var _via_is_attributes_panel_visible = false;
var _via_is_reg_attr_panel_visible   = false;
var _via_is_file_attr_panel_visible  = false;
var _via_is_canvas_zoomed            = false;
var _via_is_loading_current_image    = false;
var _via_is_region_id_visible        = true;
var _via_is_region_boundary_visible  = true;
var _via_is_region_info_visible      = false;
var _via_is_ctrl_pressed             = false;
var _via_is_debug_mode               = false;

// region
var _via_current_shape             = VIA_REGION_SHAPE.RECT;
var _via_current_polygon_region_id = -1;
var _via_user_sel_region_id        = -1;
var _via_click_x0 = 0; var _via_click_y0 = 0;
var _via_click_x1 = 0; var _via_click_y1 = 0;
var _via_region_click_x, _via_region_click_y;
var _via_region_edge          = [-1, -1];
var _via_current_x = 0; var _via_current_y = 0;

// region copy/paste
var _via_region_selected_flag = []; // region select flag for current image
var _via_copied_image_regions = [];
var _via_paste_to_multiple_images_input;

// message
var _via_message_clear_timer;

// attributes
var _via_attribute_being_updated       = 'region'; // {region, file}
var _via_attributes                    = { 'region':{}, 'file':{} };
var _via_current_attribute_id          = '';

// region group color
var _via_canvas_regions_group_color = {}; // color of each region

// invoke a method after receiving user input
var _via_user_input_ok_handler     = null;
var _via_user_input_cancel_handler = null;
var _via_user_input_data           = {};

// annotation editor
var _via_annotaion_editor_panel     = document.getElementById('annotation_editor_panel');
var _via_metadata_being_updated     = 'region'; // {region, file}
var _via_annotation_editor_mode     = VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION;

// persistence to local storage
var _via_is_local_storage_available = false;
var _via_is_save_ongoing            = false;

// all the image_id and image_filename of images added by the user is
// stored in _via_image_id_list and _via_image_filename_list
//
// Image filename list (img_fn_list) contains a filtered list of images
// currently accessible by the user. The img_fn_list is visible in the
// left side toolbar. image_grid, next/prev, etc operations depend on
// the contents of _via_img_fn_list_img_index_list.
var _via_image_id_list                 = []; // array of all image id (in order they were added by user)
var _via_image_filename_list           = []; // array of all image filename
var _via_image_load_error              = []; // {true, false}
var _via_image_filepath_resolved       = []; // {true, false}
var _via_image_filepath_id_list        = []; // path for each file

var _via_reload_img_fn_list_table      = true;
var _via_img_fn_list_img_index_list    = []; // image index list of images show in img_fn_list
var _via_img_fn_list_html              = []; // html representation of image filename list

// image grid
var image_grid_panel                        = document.getElementById('image_grid_panel');
var _via_display_area_content_name          = ''; // describes what is currently shown in display area
var _via_display_area_content_name_prev     = '';
var _via_image_grid_requires_update         = false;
var _via_image_grid_content_overflow        = false;
var _via_image_grid_load_ongoing            = false;
var _via_image_grid_page_first_index        = 0; // array index in _via_img_fn_list_img_index_list[]
var _via_image_grid_page_last_index         = -1;
var _via_image_grid_selected_img_index_list = [];
var _via_image_grid_page_img_index_list     = []; // list of all image index in current page of image grid
var _via_image_grid_visible_img_index_list  = []; // list of images currently visible in grid
var _via_image_grid_mousedown_img_index     = -1;
var _via_image_grid_mouseup_img_index       = -1;
var _via_image_grid_img_index_list          = []; // list of all image index in the image grid
var _via_image_grid_region_index_list       = []; // list of all image index in the image grid
var _via_image_grid_group                   = {}; // {'value':[image_index_list]}
var _via_image_grid_group_var               = []; // {type, name, value}
var _via_image_grid_group_show_all          = false;
var _via_image_grid_stack_prev_page         = []; // stack of first img index of every page navigated so far

// image buffer
var VIA_IMG_PRELOAD_INDICES         = [1, -1, 2, 3, -2, 4]; // for any image, preload previous 2 and next 4 images
var VIA_IMG_PRELOAD_COUNT           = 4;
var _via_buffer_preload_img_index   = -1;
var _via_buffer_img_index_list      = [];
var _via_buffer_img_shown_timestamp = [];
var _via_preload_img_promise_list   = [];

// via settings
var _via_settings = {};
_via_settings.ui  = {};
_via_settings.ui.annotation_editor_height   = 25; // in percent of the height of browser window
_via_settings.ui.annotation_editor_fontsize = 0.8;// in rem
_via_settings.ui.leftsidebar_width          = 18;  // in rem

_via_settings.ui.image_grid = {};
_via_settings.ui.image_grid.img_height          = 80;  // in pixel
_via_settings.ui.image_grid.rshape_fill         = 'none';
_via_settings.ui.image_grid.rshape_fill_opacity = 0.3;
_via_settings.ui.image_grid.rshape_stroke       = 'yellow';
_via_settings.ui.image_grid.rshape_stroke_width = 2;
_via_settings.ui.image_grid.show_region_shape   = true;
_via_settings.ui.image_grid.show_image_policy   = 'all';

_via_settings.ui.image = {};
_via_settings.ui.image.region_label      = '__via_region_id__'; // default: region_id
_via_settings.ui.image.region_color      = '__via_default_region_color__'; // default color: yellow
_via_settings.ui.image.region_label_font = '10px Sans';
_via_settings.ui.image.on_image_annotation_editor_placement = VIA_ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION;

_via_settings.core                  = {};
_via_settings.core.buffer_size      = 4*VIA_IMG_PRELOAD_COUNT + 2;
_via_settings.core.filepath         = {};
_via_settings.core.default_filepath = '';

// UI html elements
var invisible_file_input = document.getElementById("invisible_file_input");
var display_area    = document.getElementById("display_area");
var ui_top_panel    = document.getElementById("ui_top_panel");
var image_panel     = document.getElementById("image_panel");
var img_buffer_now  = document.getElementById("img_buffer_now");

var annotation_list_snippet = document.getElementById("annotation_list_snippet");
var annotation_textarea     = document.getElementById("annotation_textarea");

var img_fn_list_panel     = document.getElementById('img_fn_list_panel');
var img_fn_list           = document.getElementById('img_fn_list');
var attributes_panel      = document.getElementById('attributes_panel');
var leftsidebar           = document.getElementById('leftsidebar');

var BBOX_LINE_WIDTH       = 4;
var BBOX_SELECTED_OPACITY = 0.3;
var BBOX_BOUNDARY_FILL_COLOR_ANNOTATED = "#f2f2f2";
var BBOX_BOUNDARY_FILL_COLOR_NEW       = "#aaeeff";
var BBOX_BOUNDARY_LINE_COLOR           = "#1a1a1a";
var BBOX_SELECTED_FILL_COLOR           = "#ffffff";

var VIA_ANNOTATION_EDITOR_HEIGHT_CHANGE   = 5;   // in percent
var VIA_ANNOTATION_EDITOR_FONTSIZE_CHANGE = 0.1; // in rem
var VIA_IMAGE_GRID_IMG_HEIGHT_CHANGE      = 20;  // in percent
var VIA_LEFTSIDEBAR_WIDTH_CHANGE          = 1;   // in rem
var VIA_POLYGON_SEGMENT_SUBTENDED_ANGLE   = 5;   // in degree (used to approximate shapes using polygon)
var VIA_FLOAT_PRECISION = 3; // number of decimal places to include in float values

// COCO Export
var VIA_COCO_EXPORT_RSHAPE = ['rect', 'circle', 'ellipse', 'polygon', 'point'];
var VIA_COCO_EXPORT_ATTRIBUTE_TYPE = [VIA_ATTRIBUTE_TYPE.DROPDOWN,
                                      VIA_ATTRIBUTE_TYPE.RADIO];
//
// Data structure to store metadata about file and regions
//
function file_metadata(filename, size) {
  this.filename = filename;
  this.size     = size;         // file size in bytes
  this.regions  = [];           // array of file_region()
  this.file_attributes = {};    // image attributes
}

function file_region() {
  this.shape_attributes  = {}; // region shape attributes
  this.region_attributes = {}; // region attributes
}

//
// Initialization routine
//
function _via_init() {
  console.log(VIA_NAME);
  show_message( ' Wellcome to v1.0.0 ');

  if ( _via_is_debug_mode ) {
    document.getElementById('ui_top_panel').innerHTML += '<span>DEBUG MODE</span>';
  }

  document.getElementById('img_fn_list').style.display = 'block';
  document.getElementById('leftsidebar').style.display = 'table-cell';

  // initialize default project
  project_init_default_project();

  // initialize region canvas 2D context
  _via_init_reg_canvas_context();

  // initialize user input handlers (for both window and via_reg_canvas)
  // handles drawing of regions by user over the image
  _via_init_keyboard_handlers();
  _via_init_mouse_handlers();

  // initialize image grid
  image_grid_init();

  show_single_image_view();
  init_leftsidebar_accordion();
  attribute_update_panel_set_active_button();
  annotation_editor_set_active_button();
  init_message_panel();

  // run attached sub-modules (if any)
  // e.g. demo modules
  if (typeof _via_load_submodules === 'function') {
    console.log('Loading VIA submodule');
    setTimeout( async function() {
      await _via_load_submodules();
    }, 100);
  }

}

function _via_init_reg_canvas_context() {
  _via_reg_ctx  = _via_reg_canvas.getContext('2d');
}

function _via_init_keyboard_handlers() {
  window.addEventListener('keydown', _via_window_keydown_handler, false);
  _via_reg_canvas.addEventListener('keydown', _via_reg_canvas_keydown_handler, false);
  _via_reg_canvas.addEventListener('keyup', _via_reg_canvas_keyup_handler, false);
}

// handles drawing of regions over image by the user
function _via_init_mouse_handlers() {
  _via_reg_canvas.addEventListener('dblclick', _via_reg_canvas_dblclick_handler, false);
  _via_reg_canvas.addEventListener('mousedown', _via_reg_canvas_mousedown_handler, false);
  _via_reg_canvas.addEventListener('mouseup', _via_reg_canvas_mouseup_handler, false);
  _via_reg_canvas.addEventListener('mouseover', _via_reg_canvas_mouseover_handler, false);
  _via_reg_canvas.addEventListener('mousemove', _via_reg_canvas_mousemove_handler, false);
  _via_reg_canvas.addEventListener('wheel', _via_reg_canvas_mouse_wheel_listener, false);
  // touch screen event handlers
  // @todo: adapt for mobile users
  _via_reg_canvas.addEventListener('touchstart', _via_reg_canvas_mousedown_handler, false);
  _via_reg_canvas.addEventListener('touchend', _via_reg_canvas_mouseup_handler, false);
  _via_reg_canvas.addEventListener('touchmove', _via_reg_canvas_mousemove_handler, false);
}

//
// Download image with annotations
//

function download_as_image() {
  if ( _via_display_area_content_name !== VIA_DISPLAY_AREA_CONTENT_NAME['IMAGE'] ) {
    show_message('This functionality is only available in single image view mode');
    return;
  } else {
    var c = document.createElement('canvas');

    // ensures that downloaded image is scaled at current zoom level
    c.width  = _via_reg_canvas.width;
    c.height = _via_reg_canvas.height;

    var ct = c.getContext('2d');
    // draw current image
    ct.drawImage(_via_current_image, 0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    // draw current regions
    ct.drawImage(_via_reg_canvas, 0, 0);

    var cur_img_mime = 'image/jpeg';
    if ( _via_current_image.src.startsWith('data:') )  {
      var c1 = _via_current_image.src.indexOf(':', 0);
      var c2 = _via_current_image.src.indexOf(';', c1);
      cur_img_mime = _via_current_image.src.substring(c1 + 1, c2);
    }

    // extract image data from canvas
    var saved_img = c.toDataURL(cur_img_mime);
    saved_img.replace(cur_img_mime, "image/octet-stream");

    // simulate user click to trigger download of image
    var a      = document.createElement('a');
    a.href     = saved_img;
    a.target   = '_blank';
    a.download = _via_current_image_filename;

    // simulate a mouse click event
    var event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });

    a.dispatchEvent(event);
  }
}

//
// Display area content
//
function clear_display_area() {
  var panels = document.getElementsByClassName('display_area_content');
  var i;
  for ( i = 0; i < panels.length; ++i ) {
    panels[i].classList.add('display_none');
  }
}

function is_content_name_valid(content_name) {
  var e;
  for ( e in VIA_DISPLAY_AREA_CONTENT_NAME ) {
    if ( VIA_DISPLAY_AREA_CONTENT_NAME[e] === content_name ) {
      return true;
    }
  }
  return false;
}

function show_home_panel() {
  show_single_image_view();
}

function set_display_area_content(content_name) {
  if ( is_content_name_valid(content_name) ) {
    _via_display_area_content_name_prev = _via_display_area_content_name;
    clear_display_area();
    var p = document.getElementById(content_name);
    p.classList.remove('display_none');
    _via_display_area_content_name = content_name;
  }
}

function show_single_image_view() {
  if (_via_current_image_loaded) {
    img_fn_list_clear_all_style();
    _via_show_img(_via_image_index);
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE);
    annotation_editor_update_content();

    var p = document.getElementById('toolbar_image_grid_toggle');
    p.firstChild.setAttribute('xlink:href', '#icon_gridon');
    p.childNodes[1].innerHTML = 'Switch to Image Grid View';
  } else {
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_START_INFO);
  }
}

function show_image_grid_view() {
  if (_via_current_image_loaded) {
    img_fn_list_clear_all_style();
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID);
    image_grid_toolbar_update_group_by_select();

    if ( _via_image_grid_group_var.length === 0 ) {
      image_grid_show_all_project_images();
    }
    annotation_editor_update_content();

    var p = document.getElementById('toolbar_image_grid_toggle');
    p.firstChild.setAttribute('xlink:href', '#icon_gridoff');
    p.childNodes[1].innerHTML = 'Switch to Single Image View';

    //edit_file_metadata_in_annotation_editor();
  } else {
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_START_INFO);
  }
}

//
// Handlers for top navigation bar
//
function sel_local_images() {
  // source: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
  if (invisible_file_input) {
    invisible_file_input.setAttribute('multiple', 'multiple');
    invisible_file_input.accept   = '.jpg,.jpeg,.png,.bmp';
    invisible_file_input.onchange = project_file_add_local;
    invisible_file_input.click();
  }
}

// invoked by menu-item buttons in HTML UI
function download_all_region_data(type, file_extension) {
  if ( typeof(file_extension) === 'undefined' ) {
    file_extension = type;
  }
  // Javascript strings (DOMString) is automatically converted to utf-8
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
  pack_via_metadata(type).then( function(data) {
    var blob_attr = {type: 'text/'+file_extension+';charset=utf-8'};
    var all_region_data_blob = new Blob(data, blob_attr);

    var filename = 'via_export';
    if(typeof(_via_settings) !== 'undefined' &&
       _via_settings.hasOwnProperty('project') &&
       _via_settings['project']['name'] !== '') {
      filename = _via_settings['project']['name'];
    }
    if ( file_extension !== 'csv' || file_extension !== 'json' ) {
      filename += '_' + type + '.' + file_extension;
    }
    save_data_to_local_file(all_region_data_blob, filename);
  }.bind(this), function(err) {
    show_message('Failed to download data: [' + err + ']');
  }.bind(this));
}

function sel_local_data_file(type) {
  if (invisible_file_input) {
    switch(type) {
    case 'annotations':
      invisible_file_input.accept='.csv,.json';
      invisible_file_input.onchange = import_annotations_from_file;
      break;

    case 'annotations_coco':
      invisible_file_input.accept='.json';
      invisible_file_input.onchange = load_coco_annotations_json_file;
      break;

    case 'files_url':
      invisible_file_input.accept='';
      invisible_file_input.onchange = import_files_url_from_file;
      break;

    case 'attributes':
      invisible_file_input.accept='json';
      invisible_file_input.onchange = project_import_attributes_from_file;
      break;

    default:
      console.log('sel_local_data_file() : unknown type ' + type);
      return;
    }
    invisible_file_input.removeAttribute('multiple');
    invisible_file_input.click();
  }
}

//
// Data Importer
//
function import_files_url_from_file(event) {
  var selected_files = event.target.files;
  var i, file;
  for ( i = 0; i < selected_files.length; ++i ) {
    file = selected_files[i];
    load_text_file(file, import_files_url_from_csv);
  }
}

function import_annotations_from_file(event) {
  var selected_files = event.target.files;
  var i, file;
  for ( i = 0; i < selected_files.length; ++i ) {
    file = selected_files[i];
    switch ( file.type ) {
    case '': // Fall-through // Windows 10: Firefox and Chrome do not report filetype
      show_message('File type for ' + file.name + ' cannot be determined! Assuming text/plain.');
    case 'text/plain': // Fall-through
    case 'application/vnd.ms-excel': // Fall-through // @todo: filetype of VIA csv annotations in Windows 10 , fix this (reported by @Eli Walker)
    case 'text/csv':
      load_text_file(file, import_annotations_from_csv);
      break;

    case 'text/json': // Fall-through
    case 'application/json':
      load_text_file(file, import_annotations_from_json);
      break;

    default:
      show_message('Annotations cannot be imported from file of type ' + file.type);
      break;
    }
  }
}

function load_coco_annotations_json_file(event) {
  load_text_file(event.target.files[0], import_coco_annotations_from_json);
}

function import_annotations_from_csv(data) {
  return new Promise( function(ok_callback, err_callback) {
    if ( data === '' || typeof(data) === 'undefined') {
      err_callback();
    }

    var region_import_count = 0;
    var malformed_csv_lines_count = 0;
    var file_added_count = 0;

    var line_split_regex = new RegExp('\n|\r|\r\n', 'g');
    var csvdata = data.split(line_split_regex);

    var parsed_header = parse_csv_header_line(csvdata[0]);
    if ( ! parsed_header.is_header ) {
      show_message('Header line missing in the CSV file');
      err_callback();
      return;
    }

    var n = csvdata.length;
    var i;
    var first_img_id = '';
    for ( i = 1; i < n; ++i ) {
      // ignore blank lines
      if (csvdata[i].charAt(0) === '\n' || csvdata[i].charAt(0) === '') {
        continue;
      }

      var d = parse_csv_line(csvdata[i]);

      // check if csv line was malformed
      if ( d.length !== parsed_header.csv_column_count ) {
        malformed_csv_lines_count += 1;
        continue;
      }

      var filename = d[parsed_header.filename_index];
      var size     = d[parsed_header.size_index];
      var img_id   = _via_get_image_id(filename, size);

      // check if file is already present in this project
      if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
        img_id = project_add_new_file(filename, size);
        if ( _via_settings.core.default_filepath === '' ) {
          _via_img_src[img_id] = filename;
        } else {
          _via_file_resolve_file_to_default_filepath(img_id);
        }
        file_added_count += 1;

        if ( first_img_id === '' ) {
          first_img_id = img_id;
        }
      }

      // copy file attributes
      if ( d[parsed_header.file_attr_index] !== '"{}"') {
        var fattr = d[parsed_header.file_attr_index];
        fattr     = remove_prefix_suffix_quotes( fattr );
        fattr     = unescape_from_csv( fattr );

        var m = json_str_to_map( fattr );
        for( var key in m ) {
          _via_img_metadata[img_id].file_attributes[key] = m[key];

          // add this file attribute to _via_attributes
          if ( ! _via_attributes['file'].hasOwnProperty(key) ) {
            _via_attributes['file'][key] = { 'type':'text' };
          }
        }
      }

      var region_i = new file_region();
      // copy regions shape attributes
      if ( d[parsed_header.region_shape_attr_index] !== '"{}"' ) {
        var sattr = d[parsed_header.region_shape_attr_index];
        sattr     = remove_prefix_suffix_quotes( sattr );
        sattr     = unescape_from_csv( sattr );

        var m = json_str_to_map( sattr );
        for ( var key in m ) {
          region_i.shape_attributes[key] = m[key];
        }
      }

      // copy region attributes
      if ( d[parsed_header.region_attr_index] !== '"{}"' ) {
        var rattr = d[parsed_header.region_attr_index];
        rattr     = remove_prefix_suffix_quotes( rattr );
        rattr     = unescape_from_csv( rattr );

        var m = json_str_to_map( rattr );
        for ( var key in m ) {
          region_i.region_attributes[key] = m[key];

          // add this region attribute to _via_attributes
          if ( ! _via_attributes['region'].hasOwnProperty(key) ) {
            _via_attributes['region'][key] = { 'type':'text' };
          }
        }
      }

      // add regions only if they are present
      if (Object.keys(region_i.shape_attributes).length > 0 ||
          Object.keys(region_i.region_attributes).length > 0 ) {
        _via_img_metadata[img_id].regions.push(region_i);
        region_import_count += 1;
      }
    }
    show_message('Import Summary : [' + file_added_count + '] new files, ' +
                 '[' + region_import_count + '] regions, ' +
                 '[' + malformed_csv_lines_count  + '] malformed csv lines.');

    if ( file_added_count ) {
      update_img_fn_list();
    }

    if ( _via_current_image_loaded ) {
      if ( region_import_count ) {
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
      }
    } else {
      if ( file_added_count ) {
        var first_img_index = _via_image_id_list.indexOf(first_img_id);
        _via_show_img( first_img_index );
      }
    }
    ok_callback([file_added_count, region_import_count, malformed_csv_lines_count]);
  });
}

function parse_csv_header_line(line) {
  var header_via_10x = '#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes'; // VIA versions 1.0.x
  var header_via_11x = 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes'; // VIA version 1.1.x

  if ( line === header_via_10x || line === header_via_11x ) {
    return { 'is_header':true,
             'filename_index': 0,
             'size_index': 1,
             'file_attr_index': 2,
             'region_shape_attr_index': 5,
             'region_attr_index': 6,
             'csv_column_count': 7
           }
  } else {
    return { 'is_header':false };
  }
}

// see http://cocodataset.org/#format-data
function import_coco_annotations_from_json(data_str) {
  return new Promise( function(ok_callback, err_callback) {
    if (data_str === '' || typeof(data_str) === 'undefined') {
      show_message('Empty file');
      return;
    }
    var coco = JSON.parse(data_str);
    if( !coco.hasOwnProperty('info') ||
        !coco.hasOwnProperty('categories') ||
        !coco.hasOwnProperty('annotations') ||
        !coco.hasOwnProperty('images') ) {
      show_message('File does not contain valid annotations in COCO format.');
      return;
    }

    // create _via_attributes from coco['categories']
    var category_id_to_attribute_name = {};
    for( var i in coco['categories'] ) {
      var sc    = coco['categories'][i]['supercategory'];
      var cid   = coco['categories'][i]['id'];
      var cname = coco['categories'][i]['name'];
      if( !_via_attributes['region'].hasOwnProperty(sc)) {
        _via_attributes['region'][sc] = {'type':VIA_ATTRIBUTE_TYPE.RADIO,
                                         'description':'coco["categories"][' + i + ']=' + JSON.stringify(coco['categories'][i]),
                                         'options':{},
                                         'default_options':{}
                                        };
      }
      _via_attributes['region'][sc]['options'][cid] = cname;
      category_id_to_attribute_name[cid] = sc;
    }
    // if more than 5 options, convert the attribute type to DROPDOWN
    for( var attr_name in _via_attributes['region'] ) {
      if( Object.keys(_via_attributes['region'][attr_name]['options']).length > 5 ) {
        _via_attributes['region'][attr_name]['type'] = VIA_ATTRIBUTE_TYPE.DROPDOWN;
      }
    }

    // create an map of image_id and their annotations
    var image_id_to_annotation_index = {};
    for ( var annotation_index in coco['annotations'] ) {
      var coco_image_id = coco.annotations[annotation_index]['image_id'];
      if ( !image_id_to_annotation_index.hasOwnProperty(coco_image_id) ) {
        image_id_to_annotation_index[coco_image_id] = [];
      }
      image_id_to_annotation_index[coco_image_id].push( annotation_index );
    }

    // add all files and annotations
    _via_img_metadata = {};
    _via_image_id_list = [];
    _via_image_filename_list = [];
    _via_img_count = 0;
    var imported_file_count = 0;
    var imported_region_count = 0;
    for ( var coco_img_index in coco['images'] ) {
      var coco_img_id = coco['images'][coco_img_index]['id'];
      var filename;
      if ( coco.images[coco_img_index].hasOwnProperty('coco_url') &&
           coco.images[coco_img_index]['coco_url'] !== "") {
        filename = coco.images[coco_img_index]['coco_url'];
      } else {
        filename = coco.images[coco_img_index]['file_name'];
      }
      _via_img_metadata[coco_img_id] = { 'filename':filename,
                                         'size'    :-1,
                                         'regions' :[],
                                         'file_attributes': {
                                           'width' :coco.images[coco_img_index]['width'],
                                           'height':coco.images[coco_img_index]['height']
                                         },
                                       };
      _via_image_id_list.push(coco_img_id);
      _via_image_filename_list.push(filename);
      _via_img_count = _via_img_count + 1;

      // add all annotations associated with this file
      if ( image_id_to_annotation_index.hasOwnProperty(coco_img_id) ) {
        for ( var i in image_id_to_annotation_index[coco_img_id] ) {
          var annotation_i = coco['annotations'][ image_id_to_annotation_index[coco_img_id][i] ];
          var bbox_from_polygon = polygon_to_bbox(annotation_i['segmentation']);

          // ensure rectangles get imported as rectangle (and not as polygon)
          var is_rectangle = true;
          for (var j = 0; i < annotation_i['bbox'].length; ++j) {
            if (annotation_i['bbox'][j] !== bbox_from_polygon[j]) {
              is_rectangle = false;
              break;
            }
          }

          var region_i = { 'shape_attributes': {}, 'region_attributes': {} };
          var attribute_name = category_id_to_attribute_name[ annotation_i['category_id'] ];
          var attribute_value = annotation_i['category_id'].toString();
          region_i['region_attributes'][attribute_name] = attribute_value;

          if ( annotation_i['segmentation'][0].length === 8 && is_rectangle ) {
            region_i['shape_attributes'] = { 'name':'rect',
                                             'x': annotation_i['bbox'][0],
                                             'y': annotation_i['bbox'][1],
                                             'width': annotation_i['bbox'][2],
                                             'height': annotation_i['bbox'][3]};
          } else {
            region_i['shape_attributes'] = { 'name':'polygon',
                                             'all_points_x':[],
                                             'all_points_y':[]};
            for ( var j = 0; j < annotation_i['segmentation'][0].length; j = j + 2 ) {
              region_i['shape_attributes']['all_points_x'].push( annotation_i['segmentation'][0][j] );
              region_i['shape_attributes']['all_points_y'].push( annotation_i['segmentation'][0][j+1] );
            }
          }
          _via_img_metadata[coco_img_id]['regions'].push(region_i);
          imported_region_count = imported_region_count + 1;
        }
      }
    }
    show_message('Import Summary : [' + _via_img_count + '] new files, ' +
                 '[' + imported_region_count + '] regions.');

    if(_via_img_count) {
      update_img_fn_list();
    }

    if(_via_current_image_loaded) {
      if(imported_region_count) {
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
      }
    } else {
      if(_via_img_count) {
        _via_show_img(0);
      }
    }
    ok_callback([_via_img_count, imported_region_count, 0]);
  });
}

function import_annotations_from_json(data_str) {
  return new Promise( function(ok_callback, err_callback) {
    if (data_str === '' || typeof(data_str) === 'undefined') {
      return;
    }

    var d = JSON.parse(data_str);
    var region_import_count = 0;
    var file_added_count    = 0;
    var malformed_entries_count    = 0;
    for (var img_id in d) {
      if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
        project_add_new_file(d[img_id].filename, d[img_id].size, img_id);
        if ( _via_settings.core.default_filepath === '' ) {
          _via_img_src[img_id] = d[img_id].filename;
        } else {
          _via_file_resolve_file_to_default_filepath(img_id);
        }
        file_added_count += 1;
      }

      // copy file attributes
      for ( var key in d[img_id].file_attributes ) {
        if ( key === '' ) {
          continue;
        }

        _via_img_metadata[img_id].file_attributes[key] = d[img_id].file_attributes[key];

        // add this file attribute to _via_attributes
        if ( ! _via_attributes['file'].hasOwnProperty(key) ) {
          _via_attributes['file'][key] = { 'type':'text' };
        }
      }

      // copy regions
      var regions = d[img_id].regions;
      for ( var i in regions ) {
        var region_i = new file_region();
        for ( var sid in regions[i].shape_attributes ) {
          region_i.shape_attributes[sid] = regions[i].shape_attributes[sid];
        }
        for ( var rid in regions[i].region_attributes ) {
          if ( rid === '' ) {
            continue;
          }

          region_i.region_attributes[rid] = regions[i].region_attributes[rid];

          // add this region attribute to _via_attributes
          if ( ! _via_attributes['region'].hasOwnProperty(rid) ) {
            _via_attributes['region'][rid] = { 'type':'text' };
          }
        }

        // add regions only if they are present
        if ( Object.keys(region_i.shape_attributes).length > 0 ||
             Object.keys(region_i.region_attributes).length > 0 ) {
          _via_img_metadata[img_id].regions.push(region_i);
          region_import_count += 1;
        }
      }
    }
    show_message('Import Summary : [' + file_added_count + '] new files, ' +
                 '[' + region_import_count + '] regions, ' +
                 '[' + malformed_entries_count + '] malformed entries.');

    if ( file_added_count ) {
      update_img_fn_list();
    }

    if ( _via_current_image_loaded ) {
      if ( region_import_count ) {
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
      }
    } else {
      if ( file_added_count ) {
        _via_show_img(0);
      }
    }

    ok_callback([file_added_count, region_import_count, malformed_entries_count]);
  });
}

// assumes that csv line follows the RFC 4180 standard
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function parse_csv_line(s, field_separator) {
  if (typeof(s) === 'undefined' || s.length === 0 ) {
    return [];
  }

  if (typeof(field_separator) === 'undefined') {
    field_separator = ',';
  }
  var double_quote_seen = false;
  var start = 0;
  var d = [];

  var i = 0;
  while ( i < s.length) {
    if (s.charAt(i) === field_separator) {
      if (double_quote_seen) {
        // field separator inside double quote is ignored
        i = i + 1;
      } else {
        //var part = s.substr(start, i - start);
        d.push( s.substr(start, i - start) );
        start = i + 1;
        i = i + 1;
      }
    } else {
      if (s.charAt(i) === '"') {
        if (double_quote_seen) {
          if (s.charAt(i+1) === '"') {
            // ignore escaped double quotes
            i = i + 2;
          } else {
            // closing of double quote
            double_quote_seen = false;
            i = i + 1;
          }
        } else {
          double_quote_seen = true;
          start = i;
          i = i + 1;
        }
      } else {
        i = i + 1;
      }
    }

  }
  // extract the last field (csv rows have no trailing comma)
  d.push( s.substr(start) );
  return d;
}

// s = '{"name":"rect","x":188,"y":90,"width":243,"height":233}'
function json_str_to_map(s) {
  if (typeof(s) === 'undefined' || s.length === 0 ) {
    return {};
  }

  return JSON.parse(s);
}

// ensure the exported json string conforms to RFC 4180
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function map_to_json(m) {
  var s = [];
  for ( var key in m ) {
    var v   = m[key];
    var si  = JSON.stringify(key);
    si += VIA_CSV_KEYVAL_SEP;
    si += JSON.stringify(v);
    s.push( si );
  }
  return '{' + s.join(VIA_CSV_SEP) + '}';
}

function escape_for_csv(s) {
  return s.replace(/["]/g, '""');
}

function unescape_from_csv(s) {
  return s.replace(/""/g, '"');
}

function remove_prefix_suffix_quotes(s) {
  if ( s.charAt(0) === '"' && s.charAt(s.length-1) === '"' ) {
    return s.substr(1, s.length-2);
  } else {
    return s;
  }
}

function clone_image_region(r0) {
  var r1 = new file_region();

  // copy shape attributes
  for ( var key in r0.shape_attributes ) {
    r1.shape_attributes[key] = clone_value(r0.shape_attributes[key]);
  }

  // copy region attributes
  for ( var key in r0.region_attributes ) {
    r1.region_attributes[key] = clone_value(r0.region_attributes[key]);
  }
  return r1;
}

function clone_value(value) {
  if ( typeof(value) === 'object' ) {
    if ( Array.isArray(value) ) {
      return value.slice(0);
    } else {
      var copy = {};
      for ( var p in value ) {
        if ( value.hasOwnProperty(p) ) {
          copy[p] = clone_value(value[p]);
        }
      }
      return copy;
    }
  }
  return value;
}

function _via_get_image_id(filename, size) {
  if ( typeof(size) === 'undefined' ) {
    return filename;
  } else {
    return filename + size;
  }
}

function load_text_file(text_file, callback_function) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.addEventListener( 'progress', function(e) {
      show_message('Loading data from file : ' + text_file.name + ' ... ');
    }, false);

    text_reader.addEventListener( 'error', function() {
      show_message('Error loading data text file :  ' + text_file.name + ' !');
      callback_function('');
    }, false);

    text_reader.addEventListener( 'load', function() {
      callback_function(text_reader.result);
    }, false);
    text_reader.readAsText(text_file, 'utf-8');
  }
}

function import_files_url_from_csv(data) {
  return new Promise( function(ok_callback, err_callback) {
    if ( data === '' || typeof(data) === 'undefined') {
      err_callback();
    }

    var malformed_url_count = 0;
    var url_added_count = 0;

    var line_split_regex = new RegExp('\n|\r|\r\n', 'g');
    var csvdata = data.split(line_split_regex);

    var percent_completed = 0;
    var n = csvdata.length;
    var i;
    var img_id;
    var first_img_id = '';
    for ( i=0; i < n; ++i ) {
      // ignore blank lines
      if (csvdata[i].charAt(0) === '\n' || csvdata[i].charAt(0) === '') {
        malformed_url_count += 1;
        continue;
      } else {
        img_id = project_file_add_url(csvdata[i]);
        if ( first_img_id === '' ) {
          first_img_id = img_id;
        }
        url_added_count += 1;
      }
    }
    show_message('Added ' + url_added_count + ' files to project');
    if ( url_added_count ) {
      var first_img_index = _via_image_id_list.indexOf(first_img_id);
      _via_show_img(first_img_index);
      update_img_fn_list();
    }
  });
}

//
// Data Exporter
//
function pack_via_metadata(return_type) {
  return new Promise( function(ok_callback, err_callback) {
    if( return_type === 'csv' ) {
      var csvdata = [];
      var csvheader = 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes';
      csvdata.push(csvheader);

      for ( var image_id in _via_img_metadata ) {
        var fattr = map_to_json( _via_img_metadata[image_id].file_attributes );
        fattr = escape_for_csv( fattr );

        var prefix = '\n' + _via_img_metadata[image_id].filename;
        prefix += ',' + _via_img_metadata[image_id].size;
        prefix += ',"' + fattr + '"';

        var r = _via_img_metadata[image_id].regions;

        if ( r.length !==0 ) {
          for ( var i = 0; i < r.length; ++i ) {
            var csvline = [];
            csvline.push(prefix);
            csvline.push(r.length);
            csvline.push(i);

            var sattr = map_to_json( r[i].shape_attributes );
            sattr = '"' +  escape_for_csv( sattr ) + '"';
            csvline.push(sattr);

            var rattr = map_to_json( r[i].region_attributes );
            rattr = '"' +  escape_for_csv( rattr ) + '"';
            csvline.push(rattr);
            csvdata.push( csvline.join(VIA_CSV_SEP) );
          }
        } else {
          // @todo: reconsider this practice of adding an empty entry
          csvdata.push(prefix + ',0,0,"{}","{}"');
        }
      }
      ok_callback(csvdata);
    }

    // see http://cocodataset.org/#format-data
    if( return_type === 'coco' ) {
      img_stat_set_all().then( function(ok) {
        var coco = export_project_to_coco_format();
        ok_callback( [ coco ] );
      }.bind(this), function(err) {
        err_callback(err);
      }.bind(this));
    } else {
      // default format is JSON
      ok_callback( [ JSON.stringify(_via_img_metadata) ] );
    }
  }.bind(this));
}

function export_project_to_coco_format() {
  var coco = { 'info':{}, 'images':[], 'annotations':[], 'licenses':[], 'categories':[] };
  coco['info'] = { 'year': new Date().getFullYear(),
                   'version': '1.0',
                   'description': 'VIA project exported to COCO format using VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via/)',
                   'contributor': '',
                   'url': 'http://www.robots.ox.ac.uk/~vgg/software/via/',
                   'date_created': new Date().toString(),
                 };
  coco['licenses'] = [ {'id':0, 'name':'Unknown License', 'url':''} ]; // indicates that license is unknown

  var skipped_annotation_count = 0;
  // We want to ensure that a COCO project imported in VIA and then exported again back to
  // COCO format using VIA retains the image_id and category_id present in the original COCO project.
  // A VIA project that has been created by importing annotations from a COCO project contains
  // unique image_id of type integer and contains all unique option id. If we detect this, we reuse
  // the existing image_id and category_id, otherwise we assign a new unique id sequentially.
  // Currently, it is not possible to preserve the annotation_id
  var assign_unique_id = false;
  for(var img_id in _via_img_metadata) {
    if(Number.isNaN(parseInt(img_id))) {
      assign_unique_id = true; // since COCO only supports image_id of type integer, we cannot reuse the VIA's image-id
      break;
    }
  }
  if(assign_unique_id) {
    // check if all the options have unique id
    var attribute_option_id_list = [];
    for(var attr_name in _via_attributes) {
      if( !VIA_COCO_EXPORT_ATTRIBUTE_TYPE.includes(_via_attributes[attr_name]['type']) ) {
        continue; // skip this attribute as it will not be included in COCO export
      }

      for(var attr_option_id in _via_attributes[attr_name]['options']) {
        if(attribute_option_id_list.includes(attr_option_id) ||
           Number.isNaN(parseInt(attr_option_id)) ) {
          assign_unique_id = true;
          break;
        } else {
          attribute_option_id_list.push(assign_unique_id);
        }
      }
    }
  }

  // add categories
  var attr_option_id_list = [];
  var attr_option_id_to_category_id = {};
  var unique_category_id = 1;
  for(var attr_name in _via_attributes['region']) {
    if( VIA_COCO_EXPORT_ATTRIBUTE_TYPE.includes(_via_attributes['region'][attr_name]['type']) ) {
      for(var attr_option_id in _via_attributes['region'][attr_name]['options']) {
        var category_id;
        if(assign_unique_id) {
          category_id = unique_category_id;
          unique_category_id = unique_category_id + 1;
        } else {
          category_id = parseInt(attr_option_id);
        }
        coco['categories'].push({
          'supercategory':attr_name,
          'id':category_id,
          'name':_via_attributes['region'][attr_name]['options'][attr_option_id]
        });
        attr_option_id_to_category_id[attr_option_id] = category_id;
      }
    }
  }

  // add files and all their associated annotations
  var annotation_id = 1;
  var unique_img_id = 1;
  for( var img_index in _via_image_id_list ) {
    var img_id = _via_image_id_list[img_index];
    var file_src = _via_settings['core']['default_filepath'] + _via_img_metadata[img_id].filename;
    if ( _via_img_fileref[img_id] instanceof File ) {
      file_src = _via_img_fileref[img_id].filename;
    }

    var coco_img_id;
    if(assign_unique_id) {
      coco_img_id = unique_img_id;
      unique_img_id = unique_img_id + 1;
    } else {
      coco_img_id = parseInt(img_id);
    }

    coco['images'].push( {
      'id':coco_img_id,
      'width':_via_img_stat[img_index][0],
      'height':_via_img_stat[img_index][1],
      'file_name':_via_img_metadata[img_id].filename,
      'license':0,
      'flickr_url':file_src,
      'coco_url':file_src,
      'date_captured':'',
    } );

    // add all annotations associated with this file
    for( var rindex in _via_img_metadata[img_id].regions ) {
      var region = _via_img_metadata[img_id].regions[rindex];
      if( !VIA_COCO_EXPORT_RSHAPE.includes(region.shape_attributes['name']) ) {
        skipped_annotation_count = skipped_annotation_count + 1;
        continue; // skip this region as COCO does not allow it
      }

      var coco_annotation = via_region_shape_to_coco_annotation(region.shape_attributes);
      coco_annotation['id'] = annotation_id;
      coco_annotation['image_id'] = coco_img_id;

      var region_aid_list = Object.keys(region['region_attributes']);
      for(var region_attribute_id in region['region_attributes']) {
        var region_attribute_value = region['region_attributes'][region_attribute_id];
        if(attr_option_id_to_category_id.hasOwnProperty(region_attribute_value)) {
          coco_annotation['category_id'] = attr_option_id_to_category_id[region_attribute_value];
          coco['annotations'].push(coco_annotation);
          annotation_id = annotation_id + 1;
        } else {
          skipped_annotation_count = skipped_annotation_count + 1;
          continue; // skip attribute value not supported by COCO format
        }
      }
    }
  }

  show_message('Skipped ' + skipped_annotation_count + ' annotations. COCO format only supports the following attribute types: ' + JSON.stringify(VIA_COCO_EXPORT_ATTRIBUTE_TYPE) + ' and region shapes: ' + JSON.stringify(VIA_COCO_EXPORT_RSHAPE));
  return [ JSON.stringify(coco) ];
}

function via_region_shape_to_coco_annotation(shape_attributes) {
  var annotation = { 'segmentation':[[]], 'area':[], 'bbox':[], 'iscrowd':0 };

  switch(shape_attributes['name']) {
  case 'rect':
    var x0 = shape_attributes['x'];
    var y0 = shape_attributes['y'];
    var w  = parseInt(shape_attributes['width']);
    var h  = parseInt(shape_attributes['height']);
    var x1 = x0 + w;
    var y1 = y0 + h;
    annotation['segmentation'][0] = [x0, y0, x1, y0, x1, y1, x0, y1];
    annotation['area'] =  w * h ;

    annotation['bbox'] = [x0, y0, w, h];
    break;

  case 'point':
    var cx = shape_attributes['cx'];
    var cy = shape_attributes['cy'];
    // 2 is for visibility - currently set to always inside segmentation.
    // see Keypoint Detection: http://cocodataset.org/#format-data
    annotation['keypoints'] = [cx, cy, 2];
    annotation['num_keypoints'] = 1;
    break;

  case 'circle':
    var a,b;
    a = shape_attributes['r'];
    b = shape_attributes['r'];
    var theta_to_radian = Math.PI/180;

    for ( var theta = 0; theta < 360; theta = theta + VIA_POLYGON_SEGMENT_SUBTENDED_ANGLE ) {
      var theta_radian = theta * theta_to_radian;
      var x = shape_attributes['cx'] + a * Math.cos(theta_radian);
      var y = shape_attributes['cy'] + b * Math.sin(theta_radian);
      annotation['segmentation'][0].push( fixfloat(x), fixfloat(y) );
    }
    annotation['bbox'] = polygon_to_bbox(annotation['segmentation'][0]);
    annotation['area'] = annotation['bbox'][2] * annotation['bbox'][3];
    break;

  case 'ellipse':
    var a,b;
    a = shape_attributes['rx'];
    b = shape_attributes['ry'];
    var rotation = 0;
    // older version of VIA2 did not support rotated ellipse and hence 'theta' attribute may not be available
    if( shape_attributes.hasOwnProperty('theta') ) {
      rotation = shape_attributes['theta'];
    }

    var theta_to_radian = Math.PI/180;

    for ( var theta = 0; theta < 360; theta = theta + VIA_POLYGON_SEGMENT_SUBTENDED_ANGLE ) {
      var theta_radian = theta * theta_to_radian;
      var x = shape_attributes['cx'] +
              ( a * Math.cos(theta_radian) * Math.cos(rotation) ) -
              ( b * Math.sin(theta_radian) * Math.sin(rotation) );
      var y = shape_attributes['cy'] +
              ( a * Math.cos(theta_radian) * Math.sin(rotation) ) +
              ( b * Math.sin(theta_radian) * Math.cos(rotation) );
      annotation['segmentation'][0].push( fixfloat(x), fixfloat(y) );
    }
    annotation['bbox'] = polygon_to_bbox(annotation['segmentation'][0]);
    annotation['area'] = annotation['bbox'][2] * annotation['bbox'][3];
    break;

  case 'polygon':
    annotation['segmentation'][0] = [];
    var x0 = +Infinity;
    var y0 = +Infinity;
    var x1 = -Infinity;
    var y1 = -Infinity;
    for ( var i in shape_attributes['all_points_x'] ) {
      annotation['segmentation'][0].push( shape_attributes['all_points_x'][i] );
      annotation['segmentation'][0].push( shape_attributes['all_points_y'][i] );
      if ( shape_attributes['all_points_x'][i] < x0 ) {
        x0 = shape_attributes['all_points_x'][i];
      }
      if ( shape_attributes['all_points_y'][i] < y0 ) {
        y0 = shape_attributes['all_points_y'][i];
      }
      if ( shape_attributes['all_points_x'][i] > x1 ) {
        x1 = shape_attributes['all_points_x'][i];
      }
      if ( shape_attributes['all_points_y'][i] > y1 ) {
        y1 = shape_attributes['all_points_y'][i];
      }
    }
    var w = x1 - x0;
    var h = y1 - y0;
    annotation['bbox'] = [x0, y0, w, h];
    annotation['area'] = w * h; // approximate area
  }
  return annotation;
}

function save_data_to_local_file(data, filename) {
  var a      = document.createElement('a');
  a.href     = URL.createObjectURL(data);
  a.download = filename;

  // simulate a mouse click event
  var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  a.dispatchEvent(event);

  // @todo: replace a.dispatchEvent() with a.click()
  // a.click() based trigger is supported in Chrome 70 and Safari 11/12 but **not** in Firefox 63
  //a.click();
}

//
// Maintainers of user interface
//

function init_message_panel() {
  var p = document.getElementById('message_panel');
  p.addEventListener('mousedown', function() {
    this.style.display = 'none';
  }, false);
  p.addEventListener('mouseover', function() {
    clearTimeout(_via_message_clear_timer); // stop any previous timeouts
  }, false);
}

function show_message(msg, t) {
  if ( _via_message_clear_timer ) {
    clearTimeout(_via_message_clear_timer); // stop any previous timeouts
  }
  var timeout = t;
  if ( typeof t === 'undefined' ) {
    timeout = VIA_THEME_MESSAGE_TIMEOUT_MS;
  }
  document.getElementById('message_panel_content').innerHTML = msg;
  document.getElementById('message_panel').style.display = 'block';

  _via_message_clear_timer = setTimeout( function() {
    document.getElementById('message_panel').style.display = 'none';
  }, timeout);
}

function _via_regions_group_color_init() {
  _via_canvas_regions_group_color = {};
  var aid = _via_settings.ui.image.region_color;
  if ( aid !== '__via_default_region_color__' ) {
    var avalue;
    for ( var i = 0; i < _via_img_metadata[_via_image_id].regions.length; ++i ) {
      avalue = _via_img_metadata[_via_image_id].regions[i].region_attributes[aid];
      _via_canvas_regions_group_color[avalue] = 1;
    }
    var color_index = 0;
    for ( avalue in _via_canvas_regions_group_color ) {
      _via_canvas_regions_group_color[avalue] = VIA_REGION_COLOR_LIST[ color_index % VIA_REGION_COLOR_LIST.length ];
      color_index = color_index + 1;
    }
  }
}

// transform regions in image space to canvas space
function _via_load_canvas_regions() {
  _via_regions_group_color_init();

  // load all existing annotations into _via_canvas_regions
  var regions = _via_img_metadata[_via_image_id].regions;
  _via_canvas_regions  = [];
  for ( var i = 0; i < regions.length; ++i ) {
    var region_i = new file_region();
    for ( var key in regions[i].shape_attributes ) {
      region_i.shape_attributes[key] = regions[i].shape_attributes[key];
    }
    _via_canvas_regions.push(region_i);

    switch(_via_canvas_regions[i].shape_attributes['name']) {
    case VIA_REGION_SHAPE.RECT:
      var x      = regions[i].shape_attributes['x'] / _via_canvas_scale;
      var y      = regions[i].shape_attributes['y'] / _via_canvas_scale;
      var width  = regions[i].shape_attributes['width']  / _via_canvas_scale;
      var height = regions[i].shape_attributes['height'] / _via_canvas_scale;

      _via_canvas_regions[i].shape_attributes['x'] = Math.round(x);
      _via_canvas_regions[i].shape_attributes['y'] = Math.round(y);
      _via_canvas_regions[i].shape_attributes['width'] = Math.round(width);
      _via_canvas_regions[i].shape_attributes['height'] = Math.round(height);
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
      var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;
      var r  = regions[i].shape_attributes['r']  / _via_canvas_scale;
      _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
      _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
      _via_canvas_regions[i].shape_attributes['r'] = Math.round(r);
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
      var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;
      var rx = regions[i].shape_attributes['rx'] / _via_canvas_scale;
      var ry = regions[i].shape_attributes['ry'] / _via_canvas_scale;
      // rotation in radians
      var theta = regions[i].shape_attributes['theta'];
      _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
      _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
      _via_canvas_regions[i].shape_attributes['rx'] = Math.round(rx);
      _via_canvas_regions[i].shape_attributes['ry'] = Math.round(ry);
      _via_canvas_regions[i].shape_attributes['theta'] = theta;
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      var all_points_x = regions[i].shape_attributes['all_points_x'].slice(0);
      var all_points_y = regions[i].shape_attributes['all_points_y'].slice(0);
      for (var j=0; j<all_points_x.length; ++j) {
        all_points_x[j] = Math.round(all_points_x[j] / _via_canvas_scale);
        all_points_y[j] = Math.round(all_points_y[j] / _via_canvas_scale);
      }
      _via_canvas_regions[i].shape_attributes['all_points_x'] = all_points_x;
      _via_canvas_regions[i].shape_attributes['all_points_y'] = all_points_y;
      break;

    case VIA_REGION_SHAPE.POINT:
      var cx = regions[i].shape_attributes['cx'] / _via_canvas_scale;
      var cy = regions[i].shape_attributes['cy'] / _via_canvas_scale;

      _via_canvas_regions[i].shape_attributes['cx'] = Math.round(cx);
      _via_canvas_regions[i].shape_attributes['cy'] = Math.round(cy);
      break;
    }
  }
}

// updates currently selected region shape
function select_region_shape(sel_shape_name) {
  for ( var shape_name in VIA_REGION_SHAPE ) {
    var ui_element = document.getElementById('region_shape_' + VIA_REGION_SHAPE[shape_name]);
    ui_element.classList.remove('selected');
  }

  _via_current_shape = sel_shape_name;
  var ui_element = document.getElementById('region_shape_' + _via_current_shape);
  ui_element.classList.add('selected');

  switch(_via_current_shape) {
  case VIA_REGION_SHAPE.RECT: // Fall-through
  case VIA_REGION_SHAPE.CIRCLE: // Fall-through
  case VIA_REGION_SHAPE.ELLIPSE:
    show_message(' Rectangle ');
    break;

  case VIA_REGION_SHAPE.POLYLINE:
  case VIA_REGION_SHAPE.POLYGON:
    _via_is_user_drawing_polygon = false;
    _via_current_polygon_region_id = -1;

    show_message('Polygon' );
    break;

  case VIA_REGION_SHAPE.POINT:
    show_message('click to define points ');
    break;

  default:
    show_message('Unknown shape!');
    break;
  }
}

function set_all_canvas_size(w, h) {
  _via_reg_canvas.height = h;
  _via_reg_canvas.width = w;

  image_panel.style.height = h + 'px';
  image_panel.style.width  = w + 'px';
}

function set_all_canvas_scale(s) {
  _via_reg_ctx.scale(s, s);
}

function show_all_canvas() {
  image_panel.style.display = 'inline-block';
}

function hide_all_canvas() {
  image_panel.style.display = 'none';
}

function jump_to_image(image_index) {
  if ( _via_img_count <= 0 ) {
    return;
  }

  switch(_via_display_area_content_name) {
  case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
    if ( image_index >= 0 && image_index < _via_img_count) {
      // @todo: jump to image grid page view with the given first image index
      show_single_image_view();
      _via_show_img(image_index);
    }
    break;
  default:
    if ( image_index >= 0 && image_index < _via_img_count) {
      _via_show_img(image_index);
    }
    break;
  }
}

function count_missing_region_attr(img_id) {
  var miss_region_attr_count = 0;
  var attr_count = Object.keys(_via_region_attributes).length;
  for( var i=0; i < _via_img_metadata[img_id].regions.length; ++i ) {
    var set_attr_count = Object.keys(_via_img_metadata[img_id].regions[i].region_attributes).length;
    miss_region_attr_count += ( attr_count - set_attr_count );
  }
  return miss_region_attr_count;
}

function count_missing_file_attr(img_id) {
  return Object.keys(_via_file_attributes).length - Object.keys(_via_img_metadata[img_id].file_attributes).length;
}

function toggle_all_regions_selection(is_selected) {
  var n = _via_img_metadata[_via_image_id].regions.length;
  var i;
  _via_region_selected_flag = [];
  for ( i = 0; i < n; ++i) {
    _via_region_selected_flag[i] = is_selected;
  }
  _via_is_all_region_selected = is_selected;
  annotation_editor_hide();
  if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS ) {
    annotation_editor_clear_row_highlight();
  }
}

function select_only_region(region_id) {
  toggle_all_regions_selection(false);
  set_region_select_state(region_id, true);
  _via_is_region_selected = true;
  _via_is_all_region_selected = false;
  _via_user_sel_region_id = region_id;
}

function set_region_select_state(region_id, is_selected) {
  _via_region_selected_flag[region_id] = is_selected;
}

function show_annotation_data() {
  pack_via_metadata('csv').then( function(data) {
    var hstr = '<pre>' + data.join('') + '</pre>';
    var window_features = 'toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes,status=no';
    window_features += ',width=800,height=600';
    var annotation_data_window = window.open('', 'Annotations (preview) ', window_features);
    annotation_data_window.document.body.innerHTML = hstr;
  }.bind(this), function(err) {
    show_message('Failed to collect annotation data!');
  }.bind(this));
}

function _via_reg_canvas_dblclick_handler(e) {
  e.stopPropagation();
  // @todo: use double click in future
}

// user clicks on the canvas
function _via_reg_canvas_mousedown_handler(e) {
  e.stopPropagation();
  _via_click_x0 = e.offsetX; _via_click_y0 = e.offsetY;
  _via_region_edge = is_on_region_corner(_via_click_x0, _via_click_y0);
  var region_id = is_inside_region(_via_click_x0, _via_click_y0);

  if ( _via_is_region_selected ) {
    // check if user clicked on the region boundary
    if ( _via_region_edge[1] > 0 ) {
      if ( !_via_is_user_resizing_region ) {
        if ( _via_region_edge[0] !== _via_user_sel_region_id ) {
          _via_user_sel_region_id = _via_region_edge[0];
        }
        // resize region
        _via_is_user_resizing_region = true;
      }
    } else {
      var yes = is_inside_this_region(_via_click_x0,
                                      _via_click_y0,
                                      _via_user_sel_region_id);
      if (yes) {
        if( !_via_is_user_moving_region ) {
          _via_is_user_moving_region = true;
          _via_region_click_x = _via_click_x0;
          _via_region_click_y = _via_click_y0;
        }
      }
      if ( region_id === -1 ) {
        // mousedown on outside any region
        _via_is_user_drawing_region = true;
        // unselect all regions
        _via_is_region_selected = false;
        _via_user_sel_region_id = -1;
        toggle_all_regions_selection(false);
      }
    }
  } else {
    if ( region_id === -1 ) {
      // mousedown outside a region
      if (_via_current_shape !== VIA_REGION_SHAPE.POLYGON &&
          _via_current_shape !== VIA_REGION_SHAPE.POLYLINE &&
          _via_current_shape !== VIA_REGION_SHAPE.POINT) {
        // this is a bounding box drawing event
        _via_is_user_drawing_region = true;
      }
    } else {
      // mousedown inside a region
      // this could lead to (1) region selection or (2) region drawing
      _via_is_user_drawing_region = true;
    }
  }
}

// implements the following functionalities:
//  - new region drawing (including polygon)
//  - moving/resizing/select/unselect existing region
function _via_reg_canvas_mouseup_handler(e) {
  e.stopPropagation();
  _via_click_x1 = e.offsetX; _via_click_y1 = e.offsetY;

  var click_dx = Math.abs(_via_click_x1 - _via_click_x0);
  var click_dy = Math.abs(_via_click_y1 - _via_click_y0);

  // indicates that user has finished moving a region
  if ( _via_is_user_moving_region ) {
    _via_is_user_moving_region = false;
    _via_reg_canvas.style.cursor = "default";

    var move_x = Math.round(_via_click_x1 - _via_region_click_x);
    var move_y = Math.round(_via_click_y1 - _via_region_click_y);

    if (Math.abs(move_x) > VIA_MOUSE_CLICK_TOL ||
        Math.abs(move_y) > VIA_MOUSE_CLICK_TOL) {
      // move all selected regions
      _via_move_selected_regions(move_x, move_y);
    } else {
      // indicates a user click on an already selected region
      // this could indicate the user's intention to select another
      // nested region within this region
      // OR
      // draw a nested region (i.e. region inside a region)

      // traverse the canvas regions in alternating ascending
      // and descending order to solve the issue of nested regions
      var nested_region_id = is_inside_region(_via_click_x0, _via_click_y0, true);
      if (nested_region_id >= 0 &&
          nested_region_id !== _via_user_sel_region_id) {
        _via_user_sel_region_id = nested_region_id;
        _via_is_region_selected = true;
        _via_is_user_moving_region = false;

        // de-select all other regions if the user has not pressed Shift
        if ( !e.shiftKey ) {
          toggle_all_regions_selection(false);
        }
        set_region_select_state(nested_region_id, true);
        annotation_editor_show();
      } else {
        // user clicking inside an already selected region
        // indicates that the user intends to draw a nested region
        toggle_all_regions_selection(false);
        _via_is_region_selected = false;

        switch (_via_current_shape) {
        case VIA_REGION_SHAPE.POLYLINE: // handled by case for POLYGON
        case VIA_REGION_SHAPE.POLYGON:
          // user has clicked on the first point in a new polygon
          // see also event 'mouseup' for _via_is_user_drawing_polygon=true
          _via_is_user_drawing_polygon = true;

          var canvas_polygon_region = new file_region();
          canvas_polygon_region.shape_attributes['name'] = _via_current_shape;
          canvas_polygon_region.shape_attributes['all_points_x'] = [Math.round(_via_click_x0)];
          canvas_polygon_region.shape_attributes['all_points_y'] = [Math.round(_via_click_y0)];
          var new_length = _via_canvas_regions.push(canvas_polygon_region);
          _via_current_polygon_region_id = new_length - 1;
          break;

        case VIA_REGION_SHAPE.POINT:
          // user has marked a landmark point
          var point_region = new file_region();
          point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
          point_region.shape_attributes['cx'] = Math.round(_via_click_x0 * _via_canvas_scale);
          point_region.shape_attributes['cy'] = Math.round(_via_click_y0 * _via_canvas_scale);
          _via_img_metadata[_via_image_id].regions.push(point_region);

          var canvas_point_region = new file_region();
          canvas_point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
          canvas_point_region.shape_attributes['cx'] = Math.round(_via_click_x0);
          canvas_point_region.shape_attributes['cy'] = Math.round(_via_click_y0);
          _via_canvas_regions.push(canvas_point_region);
          break;
        }
        annotation_editor_update_content();
      }
    }
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
    return;
  }

  // indicates that user has finished resizing a region
  if ( _via_is_user_resizing_region ) {
    // _via_click(x0,y0) to _via_click(x1,y1)
    _via_is_user_resizing_region = false;
    _via_reg_canvas.style.cursor = "default";

    // update the region
    var region_id = _via_region_edge[0];
    var image_attr = _via_img_metadata[_via_image_id].regions[region_id].shape_attributes;
    var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

    switch (canvas_attr['name']) {
    case VIA_REGION_SHAPE.RECT:
      var d = [canvas_attr['x'], canvas_attr['y'], 0, 0];
      d[2] = d[0] + canvas_attr['width'];
      d[3] = d[1] + canvas_attr['height'];

      var mx = _via_current_x;
      var my = _via_current_y;
      var preserve_aspect_ratio = false;

      // constrain (mx,my) to lie on a line connecting a diagonal of rectangle
      if ( _via_is_ctrl_pressed ) {
        preserve_aspect_ratio = true;
      }

      rect_update_corner(_via_region_edge[1], d, mx, my, preserve_aspect_ratio);
      rect_standardize_coordinates(d);

      var w = Math.abs(d[2] - d[0]);
      var h = Math.abs(d[3] - d[1]);

      image_attr['x'] = Math.round(d[0] * _via_canvas_scale);
      image_attr['y'] = Math.round(d[1] * _via_canvas_scale);
      image_attr['width'] = Math.round(w * _via_canvas_scale);
      image_attr['height'] = Math.round(h * _via_canvas_scale);

      canvas_attr['x'] = Math.round( image_attr['x'] / _via_canvas_scale);
      canvas_attr['y'] = Math.round( image_attr['y'] / _via_canvas_scale);
      canvas_attr['width'] = Math.round( image_attr['width'] / _via_canvas_scale);
      canvas_attr['height'] = Math.round( image_attr['height'] / _via_canvas_scale);
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      var dx = Math.abs(canvas_attr['cx'] - _via_current_x);
      var dy = Math.abs(canvas_attr['cy'] - _via_current_y);
      var new_r = Math.sqrt( dx*dx + dy*dy );

      image_attr['r'] = fixfloat(new_r * _via_canvas_scale);
      canvas_attr['r'] = Math.round( image_attr['r'] / _via_canvas_scale);
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      var new_rx = canvas_attr['rx'];
      var new_ry = canvas_attr['ry'];
      var new_theta = canvas_attr['theta'];
      var dx = Math.abs(canvas_attr['cx'] - _via_current_x);
      var dy = Math.abs(canvas_attr['cy'] - _via_current_y);

      switch(_via_region_edge[1]) {
      case 5:
        new_ry = Math.sqrt(dx*dx + dy*dy);
        new_theta = Math.atan2(- (_via_current_x - canvas_attr['cx']), (_via_current_y - canvas_attr['cy']));
        break;

      case 6:
        new_rx = Math.sqrt(dx*dx + dy*dy);
        new_theta = Math.atan2((_via_current_y - canvas_attr['cy']), (_via_current_x - canvas_attr['cx']));
        break;

      default:
        new_rx = dx;
        new_ry = dy;
        new_theta = 0;
        break;
      }

      image_attr['rx'] = fixfloat(new_rx * _via_canvas_scale);
      image_attr['ry'] = fixfloat(new_ry * _via_canvas_scale);
      image_attr['theta'] = fixfloat(new_theta);

      canvas_attr['rx'] = Math.round(image_attr['rx'] / _via_canvas_scale);
      canvas_attr['ry'] = Math.round(image_attr['ry'] / _via_canvas_scale);
      canvas_attr['theta'] = fixfloat(new_theta);
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      var moved_vertex_id = _via_region_edge[1] - VIA_POLYGON_RESIZE_VERTEX_OFFSET;

      if ( e.ctrlKey ) {
        // if on vertex, delete it
        // if on edge, add a new vertex
        var r = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
        var shape = r.name;
        var is_on_vertex = is_on_polygon_vertex(r['all_points_x'], r['all_points_y'], _via_current_x, _via_current_y);

        if ( is_on_vertex === _via_region_edge[1] ) {
          // click on vertex, hence delete vertex
          if ( _via_polygon_del_vertex(region_id, moved_vertex_id) ) {
            show_message('Deleted' + moved_vertex_id );
          }
        } else {
          var is_on_edge = is_on_polygon_edge(r['all_points_x'], r['all_points_y'], _via_current_x, _via_current_y);
          if ( is_on_edge === _via_region_edge[1] ) {
            // click on edge, hence add new vertex
            var vertex_index = is_on_edge - VIA_POLYGON_RESIZE_VERTEX_OFFSET;
            var canvas_x0 = Math.round(_via_click_x1);
            var canvas_y0 = Math.round(_via_click_y1);
            var img_x0 = Math.round( canvas_x0 * _via_canvas_scale );
            var img_y0 = Math.round( canvas_y0 * _via_canvas_scale );
            canvas_x0 = Math.round( img_x0 / _via_canvas_scale );
            canvas_y0 = Math.round( img_y0 / _via_canvas_scale );

            _via_canvas_regions[region_id].shape_attributes['all_points_x'].splice(vertex_index+1, 0, canvas_x0);
            _via_canvas_regions[region_id].shape_attributes['all_points_y'].splice(vertex_index+1, 0, canvas_y0);
            _via_img_metadata[_via_image_id].regions[region_id].shape_attributes['all_points_x'].splice(vertex_index+1, 0, img_x0);
            _via_img_metadata[_via_image_id].regions[region_id].shape_attributes['all_points_y'].splice(vertex_index+1, 0, img_y0);

            show_message('Added' + shape + ' region');
          }
        }
      } else {
        // update coordinate of vertex
        var imx = Math.round(_via_current_x * _via_canvas_scale);
        var imy = Math.round(_via_current_y * _via_canvas_scale);
        image_attr['all_points_x'][moved_vertex_id] = imx;
        image_attr['all_points_y'][moved_vertex_id] = imy;
        canvas_attr['all_points_x'][moved_vertex_id] = Math.round( imx / _via_canvas_scale );
        canvas_attr['all_points_y'][moved_vertex_id] = Math.round( imy / _via_canvas_scale );
      }
      break;
    } // end of switch()
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
    return;
  }

  // denotes a single click (= mouse down + mouse up)
  if ( click_dx < VIA_MOUSE_CLICK_TOL ||
       click_dy < VIA_MOUSE_CLICK_TOL ) {
    // if user is already drawing polygon, then each click adds a new point
    if ( _via_is_user_drawing_polygon ) {
      var canvas_x0 = Math.round(_via_click_x1);
      var canvas_y0 = Math.round(_via_click_y1);
      var n = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].length;
      var last_x0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'][n-1];
      var last_y0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'][n-1];
      // discard if the click was on the last vertex
      if ( canvas_x0 !== last_x0 || canvas_y0 !== last_y0 ) {
        // user clicked on a new polygon point
        _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].push(canvas_x0);
        _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'].push(canvas_y0);
      }
    } else {
      var region_id = is_inside_region(_via_click_x0, _via_click_y0);
      if ( region_id >= 0 ) {
        // first click selects region
        _via_user_sel_region_id     = region_id;
        _via_is_region_selected     = true;
        _via_is_user_moving_region  = false;
        _via_is_user_drawing_region = false;

        // de-select all other regions if the user has not pressed Shift
        if ( !e.shiftKey ) {
          annotation_editor_clear_row_highlight();
          toggle_all_regions_selection(false);
        }
        set_region_select_state(region_id, true);

        // show annotation editor only when a single region is selected
        if ( !e.shiftKey ) {
          annotation_editor_show();
        } else {
          annotation_editor_hide();
        }

        // show the region info
        if (_via_is_region_info_visible) {
          var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

          switch (canvas_attr['name']) {
          case VIA_REGION_SHAPE.RECT:
            break;

          case VIA_REGION_SHAPE.CIRCLE:
            var rf = document.getElementById('region_info');
            var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
            rf.innerHTML +=  ',' + ' Radius:' + attr['r'];
            break;

          case VIA_REGION_SHAPE.ELLIPSE:
            var rf = document.getElementById('region_info');
            var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
            rf.innerHTML +=  ',' + ' X-radius:' + attr['rx'] + ',' + ' Y-radius:' + attr['ry'];
            break;

          case VIA_REGION_SHAPE.POLYLINE:
          case VIA_REGION_SHAPE.POLYGON:
            break;
          }
        }

        show_message('click again to start drawing.')
      } else {
        if ( _via_is_user_drawing_region ) {
          // clear all region selection
          _via_is_user_drawing_region = false;
          _via_is_region_selected     = false;
          toggle_all_regions_selection(false);
          annotation_editor_hide();
        } else {
          switch (_via_current_shape) {
          case VIA_REGION_SHAPE.POLYLINE: // handled by case for POLYGON
          case VIA_REGION_SHAPE.POLYGON:
            // user has clicked on the first point in a new polygon
            // see also event 'mouseup' for _via_is_user_moving_region=true
            _via_is_user_drawing_polygon = true;

            var canvas_polygon_region = new file_region();
            canvas_polygon_region.shape_attributes['name'] = _via_current_shape;
            canvas_polygon_region.shape_attributes['all_points_x'] = [ Math.round(_via_click_x0) ];
            canvas_polygon_region.shape_attributes['all_points_y'] = [ Math.round(_via_click_y0)] ;

            var new_length = _via_canvas_regions.push(canvas_polygon_region);
            _via_current_polygon_region_id = new_length - 1;
            break;

          case VIA_REGION_SHAPE.POINT:
            // user has marked a landmark point
            var point_region = new file_region();
            point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
            point_region.shape_attributes['cx'] = Math.round(_via_click_x0 * _via_canvas_scale);
            point_region.shape_attributes['cy'] = Math.round(_via_click_y0 * _via_canvas_scale);
            _via_img_metadata[_via_image_id].regions.push(point_region);

            var canvas_point_region = new file_region();
            canvas_point_region.shape_attributes['name'] = VIA_REGION_SHAPE.POINT;
            canvas_point_region.shape_attributes['cx'] = Math.round(_via_click_x0);
            canvas_point_region.shape_attributes['cy'] = Math.round(_via_click_y0);
            _via_canvas_regions.push(canvas_point_region);

            annotation_editor_update_content();
            break;
          }
        }
      }
    }
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
    return;
  }

  // indicates that user has finished drawing a new region
  if ( _via_is_user_drawing_region ) {
    _via_is_user_drawing_region = false;
    var region_x0 = _via_click_x0;
    var region_y0 = _via_click_y0;
    var region_x1 = _via_click_x1;
    var region_y1 = _via_click_y1;

    var original_img_region = new file_region();
    var canvas_img_region = new file_region();
    var region_dx = Math.abs(region_x1 - region_x0);
    var region_dy = Math.abs(region_y1 - region_y0);
    var new_region_added = false;

    if ( region_dx > VIA_REGION_MIN_DIM && region_dy > VIA_REGION_MIN_DIM ) { // avoid regions with 0 dim
      switch(_via_current_shape) {
      case VIA_REGION_SHAPE.RECT:
        // ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
        if ( _via_click_x0 < _via_click_x1 ) {
          region_x0 = _via_click_x0;
          region_x1 = _via_click_x1;
        } else {
          region_x0 = _via_click_x1;
          region_x1 = _via_click_x0;
        }

        if ( _via_click_y0 < _via_click_y1 ) {
          region_y0 = _via_click_y0;
          region_y1 = _via_click_y1;
        } else {
          region_y0 = _via_click_y1;
          region_y1 = _via_click_y0;
        }

        var x = Math.round(region_x0 * _via_canvas_scale);
        var y = Math.round(region_y0 * _via_canvas_scale);
        var width  = Math.round(region_dx * _via_canvas_scale);
        var height = Math.round(region_dy * _via_canvas_scale);
        original_img_region.shape_attributes['name'] = 'rect';
        original_img_region.shape_attributes['x'] = x;
        original_img_region.shape_attributes['y'] = y;
        original_img_region.shape_attributes['width'] = width;
        original_img_region.shape_attributes['height'] = height;

        canvas_img_region.shape_attributes['name'] = 'rect';
        canvas_img_region.shape_attributes['x'] = Math.round( x / _via_canvas_scale );
        canvas_img_region.shape_attributes['y'] = Math.round( y / _via_canvas_scale );
        canvas_img_region.shape_attributes['width'] = Math.round( width / _via_canvas_scale );
        canvas_img_region.shape_attributes['height'] = Math.round( height / _via_canvas_scale );

        new_region_added = true;
        break;

      case VIA_REGION_SHAPE.CIRCLE:
        var cx = Math.round(region_x0 * _via_canvas_scale);
        var cy = Math.round(region_y0 * _via_canvas_scale);
        var r  = Math.round( Math.sqrt(region_dx*region_dx + region_dy*region_dy) * _via_canvas_scale );

        original_img_region.shape_attributes['name'] = 'circle';
        original_img_region.shape_attributes['cx'] = cx;
        original_img_region.shape_attributes['cy'] = cy;
        original_img_region.shape_attributes['r'] = r;

        canvas_img_region.shape_attributes['name'] = 'circle';
        canvas_img_region.shape_attributes['cx'] = Math.round( cx / _via_canvas_scale );
        canvas_img_region.shape_attributes['cy'] = Math.round( cy / _via_canvas_scale );
        canvas_img_region.shape_attributes['r'] = Math.round( r / _via_canvas_scale );

        new_region_added = true;
        break;

      case VIA_REGION_SHAPE.ELLIPSE:
        var cx = Math.round(region_x0 * _via_canvas_scale);
        var cy = Math.round(region_y0 * _via_canvas_scale);
        var rx = Math.round(region_dx * _via_canvas_scale);
        var ry = Math.round(region_dy * _via_canvas_scale);
        var theta = 0;

        original_img_region.shape_attributes['name'] = 'ellipse';
        original_img_region.shape_attributes['cx'] = cx;
        original_img_region.shape_attributes['cy'] = cy;
        original_img_region.shape_attributes['rx'] = rx;
        original_img_region.shape_attributes['ry'] = ry;
        original_img_region.shape_attributes['theta'] = theta;

        canvas_img_region.shape_attributes['name'] = 'ellipse';
        canvas_img_region.shape_attributes['cx'] = Math.round( cx / _via_canvas_scale );
        canvas_img_region.shape_attributes['cy'] = Math.round( cy / _via_canvas_scale );
        canvas_img_region.shape_attributes['rx'] = Math.round( rx / _via_canvas_scale );
        canvas_img_region.shape_attributes['ry'] = Math.round( ry / _via_canvas_scale );
        canvas_img_region.shape_attributes['theta'] = theta;

        new_region_added = true;
        break;

      case VIA_REGION_SHAPE.POINT:    // handled by case VIA_REGION_SHAPE.POLYGON
      case VIA_REGION_SHAPE.POLYLINE: // handled by case VIA_REGION_SHAPE.POLYGON
      case VIA_REGION_SHAPE.POLYGON:
        // handled by _via_is_user_drawing_polygon
        break;
      } // end of switch

      if ( new_region_added ) {
        var n1 = _via_img_metadata[_via_image_id].regions.push(original_img_region);
        var n2 = _via_canvas_regions.push(canvas_img_region);

        if ( n1 !== n2 ) {
          console.log('_via_img_metadata.regions[' + n1 + '] and _via_canvas_regions[' + n2 + '] count mismatch');
        }
        var new_region_id = n1 - 1;

        set_region_annotations_to_default_value( new_region_id );
        select_only_region(new_region_id);
        if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS &&
             _via_metadata_being_updated === 'region' ) {
          annotation_editor_add_row( new_region_id );
          annotation_editor_scroll_to_row( new_region_id );
          annotation_editor_clear_row_highlight();
          annotation_editor_highlight_row( new_region_id );
        }
        annotation_editor_show();
      }
      _via_redraw_reg_canvas();
      _via_reg_canvas.focus();
    } else {
      show_message('Prevented accidental addition of a very small region.');
    }
    return;
  }
}

function _via_reg_canvas_mouseover_handler(e) {
  // change the mouse cursor icon
  _via_redraw_reg_canvas();
  _via_reg_canvas.focus();
}

function _via_reg_canvas_mousemove_handler(e) {
  if ( !_via_current_image_loaded ) {
    return;
  }

  _via_current_x = e.offsetX; _via_current_y = e.offsetY;

  // display the cursor coordinates
  var rf = document.getElementById('region_info');
  if ( rf != null && _via_is_region_info_visible ) {
    var img_x = Math.round( _via_current_x * _via_canvas_scale );
    var img_y = Math.round( _via_current_y * _via_canvas_scale );
    rf.innerHTML = 'X:' + img_x + ',' + ' Y:' + img_y;
  }

  if ( _via_is_region_selected ) {
    // display the region's info if a region is selected
    if ( rf != null && _via_is_region_info_visible && _via_user_sel_region_id !== -1) {
      var canvas_attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
      switch (canvas_attr['name']) {
      case VIA_REGION_SHAPE.RECT:
        break;

      case VIA_REGION_SHAPE.CIRCLE:
        var rf = document.getElementById('region_info');
        var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
        rf.innerHTML +=  ',' + ' Radius:' + attr['r'];
        break;

      case VIA_REGION_SHAPE.ELLIPSE:
        var rf = document.getElementById('region_info');
        var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;
        rf.innerHTML +=  ',' + ' X-radius:' + attr['rx'] + ',' + ' Y-radius:' + attr['ry'];
        break;

      case VIA_REGION_SHAPE.POLYLINE:
      case VIA_REGION_SHAPE.POLYGON:
        break;
      }
    }

    if ( !_via_is_user_resizing_region ) {
      // check if user moved mouse cursor to region boundary
      // which indicates an intention to resize the region
      _via_region_edge = is_on_region_corner(_via_current_x, _via_current_y);

      if ( _via_region_edge[0] === _via_user_sel_region_id ) {
        switch(_via_region_edge[1]) {
          // rect
        case 1: // Fall-through // top-left corner of rect
        case 3: // bottom-right corner of rect
          _via_reg_canvas.style.cursor = "nwse-resize";
          break;
        case 2: // Fall-through // top-right corner of rect
        case 4: // bottom-left corner of rect
          _via_reg_canvas.style.cursor = "nesw-resize";
          break;

        case 5: // Fall-through // top-middle point of rect
        case 7: // bottom-middle point of rect
          _via_reg_canvas.style.cursor = "ns-resize";
          break;
        case 6: // Fall-through // top-middle point of rect
        case 8: // bottom-middle point of rect
          _via_reg_canvas.style.cursor = "ew-resize";
          break;

          // circle and ellipse
        case 5:
          _via_reg_canvas.style.cursor = "n-resize";
          break;
        case 6:
          _via_reg_canvas.style.cursor = "e-resize";
          break;

        default:
          _via_reg_canvas.style.cursor = "default";
          break;
        }

        if (_via_region_edge[1] >= VIA_POLYGON_RESIZE_VERTEX_OFFSET) {
          // indicates mouse over polygon vertex
          _via_reg_canvas.style.cursor = "crosshair";
          show_message('click on the edge.');
        }
      } else {
        var yes = is_inside_this_region(_via_current_x,
                                        _via_current_y,
                                        _via_user_sel_region_id);
        if (yes) {
          _via_reg_canvas.style.cursor = "move";
        } else {
          _via_reg_canvas.style.cursor = "default";
        }

      }
    } else {
      annotation_editor_hide() // resizing
    }
  }

  if(_via_is_user_drawing_region) {
    // draw region as the user drags the mouse cursor
    if (_via_canvas_regions.length) {
      _via_redraw_reg_canvas(); // clear old intermediate rectangle
    } else {
      // first region being drawn, just clear the full region canvas
      _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    }

    var region_x0 = _via_click_x0;
    var region_y0 = _via_click_y0;

    var dx = Math.round(Math.abs(_via_current_x - _via_click_x0));
    var dy = Math.round(Math.abs(_via_current_y - _via_click_y0));
    _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;

    switch (_via_current_shape ) {
    case VIA_REGION_SHAPE.RECT:
      if ( _via_click_x0 < _via_current_x ) {
        if ( _via_click_y0 < _via_current_y ) {
          region_x0 = _via_click_x0;
          region_y0 = _via_click_y0;
        } else {
          region_x0 = _via_click_x0;
          region_y0 = _via_current_y;
        }
      } else {
        if ( _via_click_y0 < _via_current_y ) {
          region_x0 = _via_current_x;
          region_y0 = _via_click_y0;
        } else {
          region_x0 = _via_current_x;
          region_y0 = _via_current_y;
        }
      }

      _via_draw_rect_region(region_x0, region_y0, dx, dy, false);

      // display the current region info
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' W:' + dx + ',' + ' H:' + dy;
      }
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      var circle_radius = Math.round(Math.sqrt( dx*dx + dy*dy ));
      _via_draw_circle_region(region_x0, region_y0, circle_radius, false);

      // display the current region info
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' Radius:' + circle_radius;
      }
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      _via_draw_ellipse_region(region_x0, region_y0, dx, dy, 0, false);

      // display the current region info
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' X-radius:' + fixfloat(dx) + ',' + ' Y-radius:' + fixfloat(dy);
      }
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      // this is handled by the if ( _via_is_user_drawing_polygon ) { ... }
      // see below
      break;
    }
    _via_reg_canvas.focus();
  }

  if ( _via_is_user_resizing_region ) {
    // user has clicked mouse on bounding box edge and is now moving it
    // draw region as the user drags the mouse coursor
    if (_via_canvas_regions.length) {
      _via_redraw_reg_canvas(); // clear old intermediate rectangle
    } else {
      // first region being drawn, just clear the full region canvas
      _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    }

    var region_id = _via_region_edge[0];
    var attr = _via_canvas_regions[region_id].shape_attributes;
    switch (attr['name']) {
    case VIA_REGION_SHAPE.RECT:
      // original rectangle
      var d = [attr['x'], attr['y'], 0, 0];
      d[2] = d[0] + attr['width'];
      d[3] = d[1] + attr['height'];

      var mx = _via_current_x;
      var my = _via_current_y;
      var preserve_aspect_ratio = false;
      // constrain (mx,my) to lie on a line connecting a diagonal of rectangle
      if ( _via_is_ctrl_pressed ) {
        preserve_aspect_ratio = true;
      }

      rect_update_corner(_via_region_edge[1], d, mx, my, preserve_aspect_ratio);
      rect_standardize_coordinates(d);

      var w = Math.abs(d[2] - d[0]);
      var h = Math.abs(d[3] - d[1]);
      _via_draw_rect_region(d[0], d[1], w, h, true);

      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' W:' + w + ',' + ' H:' + h;
      }
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      var dx = Math.abs(attr['cx'] - _via_current_x);
      var dy = Math.abs(attr['cy'] - _via_current_y);
      var new_r = Math.sqrt( dx*dx + dy*dy );
      _via_draw_circle_region(attr['cx'],
                              attr['cy'],
                              new_r,
                              true);
      if ( rf != null && _via_is_region_info_visible ) {
        var curr_texts = rf.innerHTML.split(",");
        rf.innerHTML = "";
        rf.innerHTML +=  curr_texts[0] + ',' + curr_texts[1] + ',' + ' Radius:' + Math.round(new_r);
      }
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      var new_rx = attr['rx'];
      var new_ry = attr['ry'];
      var new_theta = attr['theta'];
      var dx = Math.abs(attr['cx'] - _via_current_x);
      var dy = Math.abs(attr['cy'] - _via_current_y);
      switch(_via_region_edge[1]) {
      case 5:
        new_ry = Math.sqrt(dx*dx + dy*dy);
        new_theta = Math.atan2(- (_via_current_x - attr['cx']), (_via_current_y - attr['cy']));
        break;

      case 6:
        new_rx = Math.sqrt(dx*dx + dy*dy);
        new_theta = Math.atan2((_via_current_y - attr['cy']), (_via_current_x - attr['cx']));
        break;

      default:
        new_rx = dx;
        new_ry = dy;
        new_theta = 0;
        break;
      }

      _via_draw_ellipse_region(attr['cx'],
                               attr['cy'],
                               new_rx,
                               new_ry,
                               new_theta,
                               true);
      if ( rf != null && _via_is_region_info_visible ) {
        var curr_texts = rf.innerHTML.split(",");
        rf.innerHTML = "";
        rf.innerHTML = curr_texts[0] + ',' + curr_texts[1] + ',' + ' X-radius:' + fixfloat(new_rx) + ',' + ' Y-radius:' + fixfloat(new_ry);
      }
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      var moved_all_points_x = attr['all_points_x'].slice(0);
      var moved_all_points_y = attr['all_points_y'].slice(0);
      var moved_vertex_id = _via_region_edge[1] - VIA_POLYGON_RESIZE_VERTEX_OFFSET;

      moved_all_points_x[moved_vertex_id] = _via_current_x;
      moved_all_points_y[moved_vertex_id] = _via_current_y;

      _via_draw_polygon_region(moved_all_points_x,
                               moved_all_points_y,
                               true,
                               attr['name']);
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' Vertices:' + attr['all_points_x'].length;
      }
      break;
    }
    _via_reg_canvas.focus();
  }

  if ( _via_is_user_moving_region ) {
    // draw region as the user drags the mouse coursor
    if (_via_canvas_regions.length) {
      _via_redraw_reg_canvas(); // clear old intermediate rectangle
    } else {
      // first region being drawn, just clear the full region canvas
      _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    }

    var move_x = (_via_current_x - _via_region_click_x);
    var move_y = (_via_current_y - _via_region_click_y);
    var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;

    switch (attr['name']) {
    case VIA_REGION_SHAPE.RECT:
      _via_draw_rect_region(attr['x'] + move_x,
                            attr['y'] + move_y,
                            attr['width'],
                            attr['height'],
                            true);
      // display the current region info
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' W:' + attr['width'] + ',' + ' H:' + attr['height'];
      }
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      _via_draw_circle_region(attr['cx'] + move_x,
                              attr['cy'] + move_y,
                              attr['r'],
                              true);
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      if (typeof(attr['theta']) === 'undefined') { attr['theta'] = 0; }
      _via_draw_ellipse_region(attr['cx'] + move_x,
                               attr['cy'] + move_y,
                               attr['rx'],
                               attr['ry'],
                               attr['theta'],
                               true);
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      var moved_all_points_x = attr['all_points_x'].slice(0);
      var moved_all_points_y = attr['all_points_y'].slice(0);
      for (var i=0; i<moved_all_points_x.length; ++i) {
        moved_all_points_x[i] += move_x;
        moved_all_points_y[i] += move_y;
      }
      _via_draw_polygon_region(moved_all_points_x,
                               moved_all_points_y,
                               true,
                               attr['name']);
      if ( rf != null && _via_is_region_info_visible ) {
        rf.innerHTML +=  ',' + ' Vertices:' + attr['all_points_x'].length;
      }
      break;

    case VIA_REGION_SHAPE.POINT:
      _via_draw_point_region(attr['cx'] + move_x,
                             attr['cy'] + move_y,
                             true);
      break;
    }
    _via_reg_canvas.focus();
    annotation_editor_hide() // moving
    return;
  }

  if ( _via_is_user_drawing_polygon ) {
    _via_redraw_reg_canvas();
    var attr = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes;
    var all_points_x = attr['all_points_x'];
    var all_points_y = attr['all_points_y'];
    var npts = all_points_x.length;

    if ( npts > 0 ) {
      var line_x = [all_points_x.slice(npts-1), _via_current_x];
      var line_y = [all_points_y.slice(npts-1), _via_current_y];
      _via_draw_polygon_region(line_x, line_y, false, attr['name']);
    }

    if ( rf != null && _via_is_region_info_visible ) {
      rf.innerHTML +=  ',' + ' Vertices:' + npts;
    }
  }
}

function _via_move_selected_regions(move_x, move_y) {
  var i, n;
  n = _via_region_selected_flag.length;
  for ( i = 0; i < n; ++i ) {
    if ( _via_region_selected_flag[i] ) {
      _via_move_region(i, move_x, move_y);
    }
  }
}

function _via_validate_move_region(x, y, canvas_attr) {
  switch( canvas_attr['name'] ) {
    case VIA_REGION_SHAPE.RECT:
      // left and top boundary check
      if (x < 0 || y < 0) {
          show_message(' Resetting.');
          return false;
      }
      // right and bottom boundary check
      if ((y + canvas_attr['height']) > _via_current_image_height ||
          (x + canvas_attr['width']) > _via_current_image_width) {
            show_message(' Resetting.');
            return false;
      }

    // same validation for all
    case VIA_REGION_SHAPE.CIRCLE:
    case VIA_REGION_SHAPE.ELLIPSE:
    case VIA_REGION_SHAPE.POINT:
    case VIA_REGION_SHAPE.POLYLINE:
    case VIA_REGION_SHAPE.POLYGON:
      if (x < 0 || y < 0 ||
          x > _via_current_image_width || y > _via_current_image_height) {
          show_message('Resetting.');
          return false;
      }
  }
  return true;
}

function _via_move_region(region_id, move_x, move_y) {
  var image_attr = _via_img_metadata[_via_image_id].regions[region_id].shape_attributes;
  var canvas_attr = _via_canvas_regions[region_id].shape_attributes;

  switch( canvas_attr['name'] ) {
  case VIA_REGION_SHAPE.RECT:
    var xnew = image_attr['x'] + Math.round(move_x * _via_canvas_scale);
    var ynew = image_attr['y'] + Math.round(move_y * _via_canvas_scale);

    var is_valid = _via_validate_move_region(xnew, ynew, image_attr);
    if (! is_valid ) { break; }

    image_attr['x'] = xnew;
    image_attr['y'] = ynew;

    canvas_attr['x'] = Math.round( image_attr['x'] / _via_canvas_scale);
    canvas_attr['y'] = Math.round( image_attr['y'] / _via_canvas_scale);
    break;

  case VIA_REGION_SHAPE.CIRCLE: // Fall-through
  case VIA_REGION_SHAPE.ELLIPSE: // Fall-through
  case VIA_REGION_SHAPE.POINT:
    var cxnew = image_attr['cx'] + Math.round(move_x * _via_canvas_scale);
    var cynew = image_attr['cy'] + Math.round(move_y * _via_canvas_scale);

    var is_valid = _via_validate_move_region(cxnew, cynew, image_attr);
    if (! is_valid ) { break; }

    image_attr['cx'] = cxnew;
    image_attr['cy'] = cynew;

    canvas_attr['cx'] = Math.round( image_attr['cx'] / _via_canvas_scale);
    canvas_attr['cy'] = Math.round( image_attr['cy'] / _via_canvas_scale);
    break;

  case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
  case VIA_REGION_SHAPE.POLYGON:
    var img_px = image_attr['all_points_x'];
    var img_py = image_attr['all_points_y'];
    var canvas_px = canvas_attr['all_points_x'];
    var canvas_py = canvas_attr['all_points_y'];
    // clone for reverting if valiation fails
    var img_px_old = Object.assign({}, img_px);
    var img_py_old = Object.assign({}, img_py);

    // validate move
    for (var i=0; i<img_px.length; ++i) {
      var pxnew = img_px[i] + Math.round(move_x * _via_canvas_scale);
      var pynew = img_py[i] + Math.round(move_y * _via_canvas_scale);
      if (! _via_validate_move_region(pxnew, pynew, image_attr) ) {
        img_px = img_px_old;
        img_py = img_py_old;
        break;
      }
    }
    // move points
    for (var i=0; i<img_px.length; ++i) {
      img_px[i] = img_px[i] + Math.round(move_x * _via_canvas_scale);
      img_py[i] = img_py[i] + Math.round(move_y * _via_canvas_scale);
    }

    for (var i=0; i<canvas_px.length; ++i) {
      canvas_px[i] = Math.round( img_px[i] / _via_canvas_scale );
      canvas_py[i] = Math.round( img_py[i] / _via_canvas_scale );
    }
    break;
  }
}

function _via_polygon_del_vertex(region_id, vertex_id) {
  var rs    = _via_canvas_regions[region_id].shape_attributes;
  var npts  = rs['all_points_x'].length;
  var shape = rs['name'];
  if ( shape !== VIA_REGION_SHAPE.POLYGON && shape !== VIA_REGION_SHAPE.POLYLINE ) {
    show_message('Vertices can be deleted from polygon');
    return false;
  }
  if ( npts <=3 && shape === VIA_REGION_SHAPE.POLYGON ) {
    show_message('polygon must have at least 3 vertices.');
    return false;
  }
  if ( npts <=2 && shape === VIA_REGION_SHAPE.POLYLINE ) {
    show_message('polyline must have at least 2 vertices.');
    return false;
  }
  // delete vertex from canvas
  _via_canvas_regions[region_id].shape_attributes['all_points_x'].splice(vertex_id, 1);
  _via_canvas_regions[region_id].shape_attributes['all_points_y'].splice(vertex_id, 1);

  // delete vertex from image metadata
  _via_img_metadata[_via_image_id].regions[region_id].shape_attributes['all_points_x'].splice(vertex_id, 1);
  _via_img_metadata[_via_image_id].regions[region_id].shape_attributes['all_points_y'].splice(vertex_id, 1);
  return true;
}

//
// Canvas update routines
//
function _via_redraw_reg_canvas() {
  if (_via_current_image_loaded) {
    _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    if ( _via_canvas_regions.length > 0 ) {
      if (_via_is_region_boundary_visible) {
        draw_all_regions();
      }
      if (_via_is_region_id_visible) {
        draw_all_region_id();
      }
    }
  }
}

function _via_clear_reg_canvas() {
  _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
}

function draw_all_regions() {
  var aid = _via_settings.ui.image.region_color;
  var attr, is_selected, aid, avalue;
  for (var i=0; i < _via_canvas_regions.length; ++i) {
    attr = _via_canvas_regions[i].shape_attributes;
    is_selected = _via_region_selected_flag[i];

    // region stroke style may depend on attribute value
    _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
    if ( ! _via_is_user_drawing_polygon &&
         aid !== '__via_default_region_color__' ) {
      avalue = _via_img_metadata[_via_image_id].regions[i].region_attributes[aid];
      if ( _via_canvas_regions_group_color.hasOwnProperty(avalue) ) {
        _via_reg_ctx.strokeStyle = _via_canvas_regions_group_color[avalue];
      }
    }

    switch( attr['name'] ) {
    case VIA_REGION_SHAPE.RECT:
      _via_draw_rect_region(attr['x'],
                            attr['y'],
                            attr['width'],
                            attr['height'],
                            is_selected);
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      _via_draw_circle_region(attr['cx'],
                              attr['cy'],
                              attr['r'],
                              is_selected);
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      if (typeof(attr['theta']) === 'undefined') { attr['theta'] = 0; }
      _via_draw_ellipse_region(attr['cx'],
                               attr['cy'],
                               attr['rx'],
                               attr['ry'],
                               attr['theta'],
                               is_selected);
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      _via_draw_polygon_region(attr['all_points_x'],
                               attr['all_points_y'],
                               is_selected,
                               attr['name']);
      break;

    case VIA_REGION_SHAPE.POINT:
      _via_draw_point_region(attr['cx'],
                             attr['cy'],
                             is_selected);
      break;
    }
  }
}

// control point for resize of region boundaries
function _via_draw_control_point(cx, cy) {
  _via_reg_ctx.beginPath();
  _via_reg_ctx.arc(cx, cy, VIA_REGION_SHAPES_POINTS_RADIUS, 0, 2*Math.PI, false);
  _via_reg_ctx.closePath();

  _via_reg_ctx.fillStyle = VIA_THEME_CONTROL_POINT_COLOR;
  _via_reg_ctx.globalAlpha = 1.0;
  _via_reg_ctx.fill();
}

function _via_draw_rect_region(x, y, w, h, is_selected) {
  if (is_selected) {
    _via_draw_rect(x, y, w, h);

    _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.stroke();

    _via_reg_ctx.fillStyle   = VIA_THEME_SEL_REGION_FILL_COLOR;
    _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
    _via_reg_ctx.fill();
    _via_reg_ctx.globalAlpha = 1.0;

    _via_draw_control_point(x  ,   y);
    _via_draw_control_point(x+w, y+h);
    _via_draw_control_point(x  , y+h);
    _via_draw_control_point(x+w,   y);
    _via_draw_control_point(x+w/2,   y);
    _via_draw_control_point(x+w/2, y+h);
    _via_draw_control_point(x    , y+h/2);
    _via_draw_control_point(x+w  , y+h/2);
  } else {
    // draw a fill line
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_draw_rect(x, y, w, h);
    _via_reg_ctx.stroke();

    if ( w > VIA_THEME_REGION_BOUNDARY_WIDTH &&
         h > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
      // draw a boundary line on both sides of the fill line
      _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
      _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
      _via_draw_rect(x - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                     y - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                     w + VIA_THEME_REGION_BOUNDARY_WIDTH,
                     h + VIA_THEME_REGION_BOUNDARY_WIDTH);
      _via_reg_ctx.stroke();

      _via_draw_rect(x + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                     y + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                     w - VIA_THEME_REGION_BOUNDARY_WIDTH,
                     h - VIA_THEME_REGION_BOUNDARY_WIDTH);
      _via_reg_ctx.stroke();
    }
  }
}

function _via_draw_rect(x, y, w, h) {
  _via_reg_ctx.beginPath();
  _via_reg_ctx.moveTo(x  , y);
  _via_reg_ctx.lineTo(x+w, y);
  _via_reg_ctx.lineTo(x+w, y+h);
  _via_reg_ctx.lineTo(x  , y+h);
  _via_reg_ctx.closePath();
}

function _via_draw_circle_region(cx, cy, r, is_selected) {
  if (is_selected) {
    _via_draw_circle(cx, cy, r);

    _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.stroke();

    _via_reg_ctx.fillStyle   = VIA_THEME_SEL_REGION_FILL_COLOR;
    _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
    _via_reg_ctx.fill();
    _via_reg_ctx.globalAlpha = 1.0;

    _via_draw_control_point(cx + r, cy);
  } else {
    // draw a fill line
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_draw_circle(cx, cy, r);
    _via_reg_ctx.stroke();

    if ( r > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
      // draw a boundary line on both sides of the fill line
      _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
      _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
      _via_draw_circle(cx, cy,
                       r - VIA_THEME_REGION_BOUNDARY_WIDTH/2);
      _via_reg_ctx.stroke();
      _via_draw_circle(cx, cy,
                       r + VIA_THEME_REGION_BOUNDARY_WIDTH/2);
      _via_reg_ctx.stroke();
    }
  }
}

function _via_draw_circle(cx, cy, r) {
  _via_reg_ctx.beginPath();
  _via_reg_ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
  _via_reg_ctx.closePath();
}

function _via_draw_ellipse_region(cx, cy, rx, ry, rr, is_selected) {
  if (is_selected) {
    _via_draw_ellipse(cx, cy, rx, ry, rr);

    _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.stroke();

    _via_reg_ctx.fillStyle   = VIA_THEME_SEL_REGION_FILL_COLOR;
    _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
    _via_reg_ctx.fill();
    _via_reg_ctx.globalAlpha = 1.0;

    _via_draw_control_point(cx + rx * Math.cos(rr), cy + rx * Math.sin(rr));
    _via_draw_control_point(cx - rx * Math.cos(rr), cy - rx * Math.sin(rr));
    _via_draw_control_point(cx + ry * Math.sin(rr), cy - ry * Math.cos(rr));
    _via_draw_control_point(cx - ry * Math.sin(rr), cy + ry * Math.cos(rr));

  } else {
    // draw a fill line
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_draw_ellipse(cx, cy, rx, ry, rr);
    _via_reg_ctx.stroke();

    if ( rx > VIA_THEME_REGION_BOUNDARY_WIDTH &&
         ry > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
      // draw a boundary line on both sides of the fill line
      _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
      _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
      _via_draw_ellipse(cx, cy,
                        rx + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                        ry + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                        rr);
      _via_reg_ctx.stroke();
      _via_draw_ellipse(cx, cy,
                        rx - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                        ry - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                        rr);
      _via_reg_ctx.stroke();
    }
  }
}

function _via_draw_ellipse(cx, cy, rx, ry, rr) {
  _via_reg_ctx.save();

  _via_reg_ctx.beginPath();
  _via_reg_ctx.ellipse(cx, cy, rx, ry, rr, 0, 2 * Math.PI);

  _via_reg_ctx.restore(); // restore to original state
  _via_reg_ctx.closePath();
}

function _via_draw_polygon_region(all_points_x, all_points_y, is_selected, shape) {
  if ( is_selected ) {
    _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.beginPath();
    _via_reg_ctx.moveTo(all_points_x[0], all_points_y[0]);
    for ( var i=1; i < all_points_x.length; ++i ) {
      _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
    }
    if ( shape === VIA_REGION_SHAPE.POLYGON ) {
      _via_reg_ctx.lineTo(all_points_x[0], all_points_y[0]); // close loop
    }
    _via_reg_ctx.stroke();

    _via_reg_ctx.fillStyle   = VIA_THEME_SEL_REGION_FILL_COLOR;
    _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
    _via_reg_ctx.fill();
    _via_reg_ctx.globalAlpha = 1.0;
    for ( var i=0; i < all_points_x.length; ++i ) {
      _via_draw_control_point(all_points_x[i], all_points_y[i]);
    }
  } else {
    // draw a fill line
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.beginPath();
    _via_reg_ctx.moveTo(all_points_x[0], all_points_y[0]);
    for ( var i=0; i < all_points_x.length; ++i ) {
      _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
    }
    if ( shape === VIA_REGION_SHAPE.POLYGON ) {
      _via_reg_ctx.lineTo(all_points_x[0], all_points_y[0]); // close loop
    }
    _via_reg_ctx.stroke();
  }
}

function _via_draw_point_region(cx, cy, is_selected) {
  if (is_selected) {
    _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);

    _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_reg_ctx.stroke();

    _via_reg_ctx.fillStyle   = VIA_THEME_SEL_REGION_FILL_COLOR;
    _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
    _via_reg_ctx.fill();
    _via_reg_ctx.globalAlpha = 1.0;
  } else {
    // draw a fill line
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
    _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);
    _via_reg_ctx.stroke();

    // draw a boundary line on both sides of the fill line
    _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
    _via_reg_ctx.lineWidth   = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
    _via_draw_point(cx, cy,
                    VIA_REGION_POINT_RADIUS - VIA_THEME_REGION_BOUNDARY_WIDTH/2);
    _via_reg_ctx.stroke();
    _via_draw_point(cx, cy,
                    VIA_REGION_POINT_RADIUS + VIA_THEME_REGION_BOUNDARY_WIDTH/2);
    _via_reg_ctx.stroke();
  }
}

function _via_draw_point(cx, cy, r) {
  _via_reg_ctx.beginPath();
  _via_reg_ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
  _via_reg_ctx.closePath();
}

function draw_all_region_id() {
  _via_reg_ctx.shadowColor = "transparent";
  _via_reg_ctx.font = _via_settings.ui.image.region_label_font;
  for ( var i = 0; i < _via_img_metadata[_via_image_id].regions.length; ++i ) {
    var canvas_reg = _via_canvas_regions[i];

    var bbox = get_region_bounding_box(canvas_reg);
    var x = bbox[0];
    var y = bbox[1];
    var w = Math.abs(bbox[2] - bbox[0]);

    var char_width  = _via_reg_ctx.measureText('M').width;
    var char_height = 1.8 * char_width;

    var annotation_str  = (i+1).toString();
    var rattr = _via_img_metadata[_via_image_id].regions[i].region_attributes[_via_settings.ui.image.region_label];
    var rshape = _via_img_metadata[_via_image_id].regions[i].shape_attributes['name'];
    if ( _via_settings.ui.image.region_label !== '__via_region_id__' ) {
      if ( typeof(rattr) !== 'undefined' ) {
        switch( typeof(rattr) ) {
        default:
        case 'string':
          annotation_str = rattr;
          break;
        case 'object':
          annotation_str = Object.keys(rattr).join(',');
          break;
        }
      } else {
        annotation_str = 'undefined';
      }
    }

    var bgnd_rect_width;
    var strw = _via_reg_ctx.measureText(annotation_str).width;
    if ( strw > w ) {
      if ( _via_settings.ui.image.region_label === '__via_region_id__' ) {
        // region-id is always visible in full
        bgnd_rect_width = strw + char_width;
      } else {

        // if text overflows, crop it
        var str_max     = Math.floor((w * annotation_str.length) / strw);
        if ( str_max > 1 ) {
          annotation_str  = annotation_str.substr(0, str_max-1) + '.';
          bgnd_rect_width = w;
        } else {
          annotation_str  = annotation_str.substr(0, 1) + '.';
          bgnd_rect_width = 2 * char_width;
        }
      }
    } else {
      bgnd_rect_width = strw + char_width;
    }

    if (canvas_reg.shape_attributes['name'] === VIA_REGION_SHAPE.POLYGON ||
        canvas_reg.shape_attributes['name'] === VIA_REGION_SHAPE.POLYLINE) {
      // put label near the first vertex
      x = canvas_reg.shape_attributes['all_points_x'][0];
      y = canvas_reg.shape_attributes['all_points_y'][0];
    } else {
      // center the label
      x = x - (bgnd_rect_width/2 - w/2);
    }

    // ensure that the text is within the image boundaries
    if ( y < char_height ) {
      y = char_height;
    }

    // first, draw a background rectangle first
    _via_reg_ctx.fillStyle = 'black';
    _via_reg_ctx.globalAlpha = 0.8;
    _via_reg_ctx.fillRect(Math.floor(x),
                          Math.floor(y - 1.1*char_height),
                          Math.floor(bgnd_rect_width),
                          Math.floor(char_height));

    // then, draw text over this background rectangle
    _via_reg_ctx.globalAlpha = 1.0;
    _via_reg_ctx.fillStyle = 'yellow';
    _via_reg_ctx.fillText(annotation_str,
                          Math.floor(x + 0.4*char_width),
                          Math.floor(y - 0.35*char_height));

  }
}

function get_region_bounding_box(region) {
  var d = region.shape_attributes;
  var bbox = new Array(4);

  switch( d['name'] ) {
  case 'rect':
    bbox[0] = d['x'];
    bbox[1] = d['y'];
    bbox[2] = d['x'] + d['width'];
    bbox[3] = d['y'] + d['height'];
    break;

  case 'circle':
    bbox[0] = d['cx'] - d['r'];
    bbox[1] = d['cy'] - d['r'];
    bbox[2] = d['cx'] + d['r'];
    bbox[3] = d['cy'] + d['r'];
    break;

  case 'ellipse':
    let radians = d['theta'];
    let radians90 = radians + Math.PI / 2;
    let ux = d['rx'] * Math.cos(radians);
    let uy = d['rx'] * Math.sin(radians);
    let vx = d['ry'] * Math.cos(radians90);
    let vy = d['ry'] * Math.sin(radians90);

    let width = Math.sqrt(ux * ux + vx * vx) * 2;
    let height = Math.sqrt(uy * uy + vy * vy) * 2;

    bbox[0] = d['cx'] - (width / 2);
    bbox[1] = d['cy'] - (height / 2);
    bbox[2] = d['cx'] + (width / 2);
    bbox[3] = d['cy'] + (height / 2);
    break;

  case 'polyline': // handled by polygon
  case 'polygon':
    var all_points_x = d['all_points_x'];
    var all_points_y = d['all_points_y'];

    var minx = Number.MAX_SAFE_INTEGER;
    var miny = Number.MAX_SAFE_INTEGER;
    var maxx = 0;
    var maxy = 0;
    for ( var i=0; i < all_points_x.length; ++i ) {
      if ( all_points_x[i] < minx ) {
        minx = all_points_x[i];
      }
      if ( all_points_x[i] > maxx ) {
        maxx = all_points_x[i];
      }
      if ( all_points_y[i] < miny ) {
        miny = all_points_y[i];
      }
      if ( all_points_y[i] > maxy ) {
        maxy = all_points_y[i];
      }
    }
    bbox[0] = minx;
    bbox[1] = miny;
    bbox[2] = maxx;
    bbox[3] = maxy;
    break;

  case 'point':
    bbox[0] = d['cx'] - VIA_REGION_POINT_RADIUS;
    bbox[1] = d['cy'] - VIA_REGION_POINT_RADIUS;
    bbox[2] = d['cx'] + VIA_REGION_POINT_RADIUS;
    bbox[3] = d['cy'] + VIA_REGION_POINT_RADIUS;
    break;
  }
  return bbox;
}

//
// Region collision routines
//
function is_inside_region(px, py, descending_order) {
  var N = _via_canvas_regions.length;
  if ( N === 0 ) {
    return -1;
  }
  var start, end, del;
  // traverse the canvas regions in alternating ascending
  // and descending order to solve the issue of nested regions
  if ( descending_order ) {
    start = N - 1;
    end   = -1;
    del   = -1;
  } else {
    start = 0;
    end   = N;
    del   = 1;
  }

  var i = start;
  while ( i !== end ) {
    var yes = is_inside_this_region(px, py, i);
    if (yes) {
      return i;
    }
    i = i + del;
  }
  return -1;
}

function is_inside_this_region(px, py, region_id) {
  var attr   = _via_canvas_regions[region_id].shape_attributes;
  var result = false;
  switch ( attr['name'] ) {
  case VIA_REGION_SHAPE.RECT:
    result = is_inside_rect(attr['x'],
                            attr['y'],
                            attr['width'],
                            attr['height'],
                            px, py);
    break;

  case VIA_REGION_SHAPE.CIRCLE:
    result = is_inside_circle(attr['cx'],
                              attr['cy'],
                              attr['r'],
                              px, py);
    break;

  case VIA_REGION_SHAPE.ELLIPSE:
    result = is_inside_ellipse(attr['cx'],
                               attr['cy'],
                               attr['rx'],
                               attr['ry'],
                               attr['theta'],
                               px, py);
    break;

  case VIA_REGION_SHAPE.POLYLINE: // handled by POLYGON
  case VIA_REGION_SHAPE.POLYGON:
    result = is_inside_polygon(attr['all_points_x'],
                               attr['all_points_y'],
                               px, py);
    break;

  case VIA_REGION_SHAPE.POINT:
    result = is_inside_point(attr['cx'],
                             attr['cy'],
                             px, py);
    break;
  }
  return result;
}

function is_inside_circle(cx, cy, r, px, py) {
  var dx = px - cx;
  var dy = py - cy;
  return (dx * dx + dy * dy) < r * r;
}

function is_inside_rect(x, y, w, h, px, py) {
  return px > x &&
    px < (x + w) &&
    py > y &&
    py < (y + h);
}

function is_inside_ellipse(cx, cy, rx, ry, rr, px, py) {
  // Inverse rotation of pixel coordinates
  var dx = Math.cos(-rr) * (cx - px) - Math.sin(-rr) * (cy - py)
  var dy = Math.sin(-rr) * (cx - px) + Math.cos(-rr) * (cy - py)

  return ((dx * dx) / (rx * rx)) + ((dy * dy) / (ry * ry)) < 1;
}

// returns 0 when (px,py) is outside the polygon
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_inside_polygon(all_points_x, all_points_y, px, py) {
  if ( all_points_x.length === 0 || all_points_y.length === 0 ) {
    return 0;
  }

  var wn = 0;    // the  winding number counter
  var n = all_points_x.length;
  var i;
  // loop through all edges of the polygon
  for ( i = 0; i < n-1; ++i ) {   // edge from V[i] to  V[i+1]
    var is_left_value = is_left( all_points_x[i], all_points_y[i],
                                 all_points_x[i+1], all_points_y[i+1],
                                 px, py);

    if (all_points_y[i] <= py) {
      if (all_points_y[i+1]  > py && is_left_value > 0) {
        ++wn;
      }
    }
    else {
      if (all_points_y[i+1]  <= py && is_left_value < 0) {
        --wn;
      }
    }
  }

  // also take into account the loop closing edge that connects last point with first point
  var is_left_value = is_left( all_points_x[n-1], all_points_y[n-1],
                               all_points_x[0], all_points_y[0],
                               px, py);

  if (all_points_y[n-1] <= py) {
    if (all_points_y[0]  > py && is_left_value > 0) {
      ++wn;
    }
  }
  else {
    if (all_points_y[0]  <= py && is_left_value < 0) {
      --wn;
    }
  }

  if ( wn === 0 ) {
    return 0;
  }
  else {
    return 1;
  }
}

function is_inside_point(cx, cy, px, py) {
  var dx = px - cx;
  var dy = py - cy;
  var r2 = VIA_POLYGON_VERTEX_MATCH_TOL * VIA_POLYGON_VERTEX_MATCH_TOL;
  return (dx * dx + dy * dy) < r2;
}

// returns
// >0 if (x2,y2) lies on the left side of line joining (x0,y0) and (x1,y1)
// =0 if (x2,y2) lies on the line joining (x0,y0) and (x1,y1)
// >0 if (x2,y2) lies on the right side of line joining (x0,y0) and (x1,y1)
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_left(x0, y0, x1, y1, x2, y2) {
  return ( ((x1 - x0) * (y2 - y0))  - ((x2 -  x0) * (y1 - y0)) );
}

function is_on_region_corner(px, py) {
  var _via_region_edge = [-1, -1]; // region_id, corner_id [top-left=1,top-right=2,bottom-right=3,bottom-left=4]

  for ( var i = 0; i < _via_canvas_regions.length; ++i ) {
    var attr = _via_canvas_regions[i].shape_attributes;
    var result = false;
    _via_region_edge[0] = i;

    switch ( attr['name'] ) {
    case VIA_REGION_SHAPE.RECT:
      result = is_on_rect_edge(attr['x'],
                               attr['y'],
                               attr['width'],
                               attr['height'],
                               px, py);
      break;

    case VIA_REGION_SHAPE.CIRCLE:
      result = is_on_circle_edge(attr['cx'],
                                 attr['cy'],
                                 attr['r'],
                                 px, py);
      break;

    case VIA_REGION_SHAPE.ELLIPSE:
      result = is_on_ellipse_edge(attr['cx'],
                                  attr['cy'],
                                  attr['rx'],
                                  attr['ry'],
                                  attr['theta'],
                                  px, py);
      break;

    case VIA_REGION_SHAPE.POLYLINE: // handled by polygon
    case VIA_REGION_SHAPE.POLYGON:
      result = is_on_polygon_vertex(attr['all_points_x'],
                                    attr['all_points_y'],
                                    px, py);
      if ( result === 0 ) {
        result = is_on_polygon_edge(attr['all_points_x'],
                                    attr['all_points_y'],
                                    px, py);
      }
      break;

    case VIA_REGION_SHAPE.POINT:
      // since there are no edges of a point
      result = 0;
      break;
    }

    if (result > 0) {
      _via_region_edge[1] = result;
      return _via_region_edge;
    }
  }
  _via_region_edge[0] = -1;
  return _via_region_edge;
}

function is_on_rect_edge(x, y, w, h, px, py) {
  var dx0 = Math.abs(x - px);
  var dy0 = Math.abs(y - py);
  var dx1 = Math.abs(x + w - px);
  var dy1 = Math.abs(y + h - py);
  //[top-left=1,top-right=2,bottom-right=3,bottom-left=4]
  if ( dx0 < VIA_REGION_EDGE_TOL &&
       dy0 < VIA_REGION_EDGE_TOL ) {
    return 1;
  }
  if ( dx1 < VIA_REGION_EDGE_TOL &&
       dy0 < VIA_REGION_EDGE_TOL ) {
    return 2;
  }
  if ( dx1 < VIA_REGION_EDGE_TOL &&
       dy1 < VIA_REGION_EDGE_TOL ) {
    return 3;
  }

  if ( dx0 < VIA_REGION_EDGE_TOL &&
       dy1 < VIA_REGION_EDGE_TOL ) {
    return 4;
  }

  var mx0 = Math.abs(x + w/2 - px);
  var my0 = Math.abs(y + h/2 - py);
  //[top-middle=5,right-middle=6,bottom-middle=7,left-middle=8]
  if ( mx0 < VIA_REGION_EDGE_TOL &&
       dy0 < VIA_REGION_EDGE_TOL ) {
    return 5;
  }
  if ( dx1 < VIA_REGION_EDGE_TOL &&
       my0 < VIA_REGION_EDGE_TOL ) {
    return 6;
  }
  if ( mx0 < VIA_REGION_EDGE_TOL &&
       dy1 < VIA_REGION_EDGE_TOL ) {
    return 7;
  }
  if ( dx0 < VIA_REGION_EDGE_TOL &&
       my0 < VIA_REGION_EDGE_TOL ) {
    return 8;
  }

  return 0;
}

function is_on_circle_edge(cx, cy, r, px, py) {
  var dx = cx - px;
  var dy = cy - py;
  if ( Math.abs(Math.sqrt( dx*dx + dy*dy ) - r) < VIA_REGION_EDGE_TOL ) {
    var theta = Math.atan2( py - cy, px - cx );
    if ( Math.abs(theta - (Math.PI/2)) < VIA_THETA_TOL ||
         Math.abs(theta + (Math.PI/2)) < VIA_THETA_TOL) {
      return 5;
    }
    if ( Math.abs(theta) < VIA_THETA_TOL ||
         Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
      return 6;
    }

    if ( theta > 0 && theta < (Math.PI/2) ) {
      return 1;
    }
    if ( theta > (Math.PI/2) && theta < (Math.PI) ) {
      return 4;
    }
    if ( theta < 0 && theta > -(Math.PI/2) ) {
      return 2;
    }
    if ( theta < -(Math.PI/2) && theta > -Math.PI ) {
      return 3;
    }
  } else {
    return 0;
  }
}

function is_on_ellipse_edge(cx, cy, rx, ry, rr, px, py) {
  // Inverse rotation of pixel coordinates
  px = px - cx;
  py = py - cy;
  var px_ = Math.cos(-rr) * px - Math.sin(-rr) * py;
  var py_ = Math.sin(-rr) * px + Math.cos(-rr) * py;
  px = px_ + cx;
  py = py_ + cy;

  var dx = (cx - px)/rx;
  var dy = (cy - py)/ry;

  if ( Math.abs(Math.sqrt( dx*dx + dy*dy ) - 1) < VIA_ELLIPSE_EDGE_TOL ) {
    var theta = Math.atan2( py - cy, px - cx );
    if ( Math.abs(theta - (Math.PI/2)) < VIA_THETA_TOL ||
         Math.abs(theta + (Math.PI/2)) < VIA_THETA_TOL) {
      return 5;
    }
    if ( Math.abs(theta) < VIA_THETA_TOL ||
         Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
      return 6;
    }
  } else {
    return 0;
  }
}

function is_on_polygon_vertex(all_points_x, all_points_y, px, py) {
  var i, n;
  n = all_points_x.length;

  for ( i = 0; i < n; ++i ) {
    if ( Math.abs(all_points_x[i] - px) < VIA_POLYGON_VERTEX_MATCH_TOL &&
         Math.abs(all_points_y[i] - py) < VIA_POLYGON_VERTEX_MATCH_TOL ) {
      return (VIA_POLYGON_RESIZE_VERTEX_OFFSET+i);
    }
  }
  return 0;
}

function is_on_polygon_edge(all_points_x, all_points_y, px, py) {
  var i, n, di, d;
  n = all_points_x.length;
  d = [];
  for ( i = 0; i < n - 1; ++i )  {
    di = dist_to_line(px, py, all_points_x[i], all_points_y[i], all_points_x[i+1], all_points_y[i+1]);
    d.push(di);
  }
  // closing edge
  di = dist_to_line(px, py, all_points_x[n-1], all_points_y[n-1], all_points_x[0], all_points_y[0]);
  d.push(di);

  var smallest_value = d[0];
  var smallest_index = 0;
  n = d.length;
  for ( i = 1; i < n; ++i ) {
    if ( d[i] < smallest_value ) {
      smallest_value = d[i];
      smallest_index = i;
    }
  }
  if ( smallest_value < VIA_POLYGON_VERTEX_MATCH_TOL ) {
    return (VIA_POLYGON_RESIZE_VERTEX_OFFSET + smallest_index);
  } else {
    return 0;
  }
}

function is_point_inside_bounding_box(x, y, x1, y1, x2, y2) {
  // ensure that (x1,y1) is top left and (x2,y2) is bottom right corner of rectangle
  var rect = {};
  if( x1 < x2 ) {
    rect.x1 = x1;
    rect.x2 = x2;
  } else {
    rect.x1 = x2;
    rect.x2 = x1;
  }
  if ( y1 < y2 ) {
    rect.y1 = y1;
    rect.y2 = y2;
  } else {
    rect.y1 = y2;
    rect.y2 = y1;
  }

  if ( x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2 ) {
    return true;
  } else {
    return false;
  }
}

function dist_to_line(x, y, x1, y1, x2, y2) {
  if ( is_point_inside_bounding_box(x, y, x1, y1, x2, y2) ) {
    var dy = y2 - y1;
    var dx = x2 - x1;
    var nr = Math.abs( dy*x - dx*y + x2*y1 - y2*x1 );
    var dr = Math.sqrt( dx*dx + dy*dy );
    var dist = nr / dr;
    return Math.round(dist);
  } else {
    return Number.MAX_SAFE_INTEGER;
  }
}

function rect_standardize_coordinates(d) {
  // d[x0,y0,x1,y1]
  // ensures that (d[0],d[1]) is top-left corner while
  // (d[2],d[3]) is bottom-right corner
  if ( d[0] > d[2] ) {
    // swap
    var t = d[0];
    d[0] = d[2];
    d[2] = t;
  }

  if ( d[1] > d[3] ) {
    // swap
    var t = d[1];
    d[1] = d[3];
    d[3] = t;
  }
}

function rect_update_corner(corner_id, d, x, y, preserve_aspect_ratio) {
  // pre-condition : d[x0,y0,x1,y1] is standardized
  // post-condition : corner is moved ( d may not stay standardized )
  if (preserve_aspect_ratio) {
    switch(corner_id) {
    case 1: // Fall-through // top-left
    case 3: // bottom-right
      var dx = d[2] - d[0];
      var dy = d[3] - d[1];
      var norm = Math.sqrt( dx*dx + dy*dy );
      var nx = dx / norm; // x component of unit vector along the diagonal of rect
      var ny = dy / norm; // y component
      var proj = (x - d[0]) * nx + (y - d[1]) * ny;
      var proj_x = nx * proj;
      var proj_y = ny * proj;
      // constrain (mx,my) to lie on a line connecting (x0,y0) and (x1,y1)
      x = Math.round( d[0] + proj_x );
      y = Math.round( d[1] + proj_y );
      break;

    case 2: // Fall-through // top-right
    case 4: // bottom-left
      var dx = d[2] - d[0];
      var dy = d[1] - d[3];
      var norm = Math.sqrt( dx*dx + dy*dy );
      var nx = dx / norm; // x component of unit vector along the diagonal of rect
      var ny = dy / norm; // y component
      var proj = (x - d[0]) * nx + (y - d[3]) * ny;
      var proj_x = nx * proj;
      var proj_y = ny * proj;
      // constrain (mx,my) to lie on a line connecting (x0,y0) and (x1,y1)
      x = Math.round( d[0] + proj_x );
      y = Math.round( d[3] + proj_y );
      break;
    }
  }

  switch(corner_id) {
  case 1: // top-left
    d[0] = x;
    d[1] = y;
    break;

  case 3: // bottom-right
    d[2] = x;
    d[3] = y;
    break;

  case 2: // top-right
    d[2] = x;
    d[1] = y;
    break;

  case 4: // bottom-left
    d[0] = x;
    d[3] = y;
    break;

  case 5: // top-middle
    d[1] = y;
    break;

  case 6: // right-middle
    d[2] = x;
    break;

  case 7: // bottom-middle
    d[3] = y;
    break;

  case 8: // left-middle
    d[0] = x;
    break;
  }
}

function _via_update_ui_components() {
  if ( ! _via_current_image_loaded ) {
    return;
  }

  show_message('Updating user interface components.');
  switch(_via_display_area_content_name) {
  case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
    image_grid_set_content_panel_height_fixed();
    image_grid_set_content_to_current_group();
    break;
  case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE:
    if ( !_via_is_window_resized && _via_current_image_loaded ) {
      _via_is_window_resized = true;
      _via_show_img(_via_image_index);

      if (_via_is_canvas_zoomed) {
        reset_zoom_level();
      }
    }
    break;
  }
}

//
// Shortcut key handlers
//
function _via_window_keydown_handler(e) {
  if ( e.target === document.body ) {
    // process the keyboard event
    _via_handle_global_keydown_event(e);
  }
}

// global keys are active irrespective of element focus
// arrow keys, n, p, s, o, space, d, Home, End, PageUp, PageDown
function _via_handle_global_keydown_event(e) {
  // zoom
  if (_via_current_image_loaded) {
    if ( e.key === "+") {
      zoom_in();
      return;
    }

    if ( e.key === "=") {
      reset_zoom_level();
      return;
    }

    if ( e.key === "-") {
      zoom_out();
      return;
    }
  }

  if ( e.key === 'ArrowRight' || e.key === 'n') {
    move_to_next_image();
    e.preventDefault();
    return;
  }
  if ( e.key === 'ArrowLeft' || e.key === 'p') {
    move_to_prev_image();
    e.preventDefault();
    return;
  }

  if ( e.key === 'ArrowUp' ) {
    region_visualisation_update('region_label', '__via_region_id__', 1);
    e.preventDefault();
    return;
  }

  if ( e.key === 'ArrowDown' ) {
    region_visualisation_update('region_color', '__via_default_region_color__', -1);
    e.preventDefault();
    return;
  }


  if ( e.key === 'Home') {
    show_first_image();
    e.preventDefault();
    return;
  }
  if ( e.key === 'End') {
    show_last_image();
    e.preventDefault();
    return;
  }
  if ( e.key === 'PageDown') {
    jump_to_next_image_block();
    e.preventDefault();
    return;
  }
  if ( e.key === 'PageUp') {
    jump_to_prev_image_block();
    e.preventDefault();
    return;
  }

  if ( e.key === 'a' ) {
    if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
      // select all in image grid
      image_grid_group_toggle_select_all();
    }
  }

  if ( e.key === 'Escape' ) {
    e.preventDefault();
    if ( _via_is_loading_current_image ) {
      _via_cancel_current_image_loading();
    }

    if ( _via_is_user_resizing_region ) {
      // cancel region resizing action
      _via_is_user_resizing_region = false;
    }

    if ( _via_is_region_selected ) {
      // clear all region selections
      _via_is_region_selected = false;
      _via_user_sel_region_id = -1;
      toggle_all_regions_selection(false);
    }

    if ( _via_is_user_drawing_polygon ) {
      _via_is_user_drawing_polygon = false;
      _via_canvas_regions.splice(_via_current_polygon_region_id, 1);
    }

    if ( _via_is_user_drawing_region ) {
      _via_is_user_drawing_region = false;
    }

    if ( _via_is_user_resizing_region ) {
      _via_is_user_resizing_region = false
    }

    if ( _via_is_user_moving_region ) {
      _via_is_user_moving_region = false
    }

    _via_redraw_reg_canvas();
    return;
  }

  if ( e.key === 'p' ) { // Space key
    if ( e.ctrlKey ) {
      annotation_editor_toggle_on_image_editor();
    } else {
      annotation_editor_toggle_all_regions_editor();
    }
    e.preventDefault();
    return;
  }

  if ( e.key === 'F1' ) { // F1 for help
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_GETTING_STARTED);
    e.preventDefault();
    return;
  }
  if ( e.key === 'F2' ) { // F2 for about
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_ABOUT);
    e.preventDefault();
    return;
  }
}

function _via_reg_canvas_keyup_handler(e) {
  if ( e.key === 'Control' ) {
    _via_is_ctrl_pressed = false;
  }
}

function _via_reg_canvas_keydown_handler(e) {
  if ( e.key === 'Control' ) {
    _via_is_ctrl_pressed = true;
  }

  if (_via_current_image_loaded) {
    if ( e.key === 'Enter' ) {
        if ( _via_current_shape === VIA_REGION_SHAPE.POLYLINE ||
             _via_current_shape === VIA_REGION_SHAPE.POLYGON) {
          _via_polyshape_finish_drawing();
        }
    }
    if ( e.key === 'Backspace' ) {
        if ( _via_current_shape === VIA_REGION_SHAPE.POLYLINE ||
             _via_current_shape === VIA_REGION_SHAPE.POLYGON) {
          _via_polyshape_delete_last_vertex();
        }
    }

    if ( e.key === 'a' ) {
      sel_all_regions();
      e.preventDefault();
      return;
    }

    if ( e.key === 'c' ) {
      if (_via_is_region_selected ||
          _via_is_all_region_selected) {
        copy_sel_regions();
      }
      e.preventDefault();
      return;
    }

    if ( e.key === 'v' ) {
      paste_sel_regions_in_current_image();
      e.preventDefault();
      return;
    }

    if ( e.key === 'b' ) {
      toggle_region_boundary_visibility();
      e.preventDefault();
      return;
    }

    if ( e.key === 'l' ) {
      toggle_region_id_visibility();
      e.preventDefault();
      return;
    }

    if ( e.key === 'd' ) {
      if ( _via_is_region_selected ||
           _via_is_all_region_selected ) {
        del_sel_regions();
      }
      e.preventDefault();
      return;
    }

    if ( _via_is_region_selected ) {
      if ( e.key === 'ArrowRight' ||
           e.key === 'ArrowLeft'  ||
           e.key === 'ArrowDown'  ||
           e.key === 'ArrowUp' ) {
        var del = 1;
        if ( e.shiftKey ) {
          del = 10;
        }
        var move_x = 0;
        var move_y = 0;
        switch( e.key ) {
        case 'ArrowLeft':
          move_x = -del;
          break;
        case 'ArrowUp':
          move_y = -del;
          break;
        case 'ArrowRight':
          move_x =  del;
          break;
        case 'ArrowDown':
          move_y =  del;
          break;
        }
        _via_move_selected_regions(move_x, move_y);
        _via_redraw_reg_canvas();
        e.preventDefault();
        return;
      }
    }
  }
  _via_handle_global_keydown_event(e);
}

function _via_polyshape_finish_drawing() {
  if ( _via_is_user_drawing_polygon ) {
    // double click is used to indicate completion of
    // polygon or polyline drawing action
    var new_region_id = _via_current_polygon_region_id;
    var new_region_shape = _via_current_shape;

    var npts =  _via_canvas_regions[new_region_id].shape_attributes['all_points_x'].length;
    if ( npts <=2 && new_region_shape === VIA_REGION_SHAPE.POLYGON ) {
      show_message('For a polygon, you must define at least 3 points. ' +
                   'Press [Esc] to cancel drawing operation.!');
      return;
    }
    if ( npts <=1 && new_region_shape === VIA_REGION_SHAPE.POLYLINE ) {
      show_message('A polyline must have at least 2 points. ' +
                   'Press [Esc] to cancel drawing operation.!');
      return;
    }

    var img_id = _via_image_id;
    _via_current_polygon_region_id = -1;
    _via_is_user_drawing_polygon = false;
    _via_is_user_drawing_region = false;

    _via_img_metadata[img_id].regions[new_region_id] = {}; // create placeholder
    _via_polyshape_add_new_polyshape(img_id, new_region_shape, new_region_id);
    select_only_region(new_region_id); // select new region
    set_region_annotations_to_default_value( new_region_id );
    annotation_editor_add_row( new_region_id );
    annotation_editor_scroll_to_row( new_region_id );

    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
  }
  return;
}

function _via_polyshape_delete_last_vertex() {
  if ( _via_is_user_drawing_polygon ) {
    var npts = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].length;
    if ( npts > 0 ) {
      _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_x'].splice(npts - 1, 1);
      _via_canvas_regions[_via_current_polygon_region_id].shape_attributes['all_points_y'].splice(npts - 1, 1);

      _via_redraw_reg_canvas();
      _via_reg_canvas.focus();
    }
  }
}

function _via_polyshape_add_new_polyshape(img_id, region_shape, region_id) {
  // add all polygon points stored in _via_canvas_regions[]
  var all_points_x = _via_canvas_regions[region_id].shape_attributes['all_points_x'].slice(0);
  var all_points_y = _via_canvas_regions[region_id].shape_attributes['all_points_y'].slice(0);

  var canvas_all_points_x = [];
  var canvas_all_points_y = [];
  var n = all_points_x.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    all_points_x[i] = Math.round( all_points_x[i] * _via_canvas_scale );
    all_points_y[i] = Math.round( all_points_y[i] * _via_canvas_scale );

    canvas_all_points_x[i] = Math.round( all_points_x[i] / _via_canvas_scale );
    canvas_all_points_y[i] = Math.round( all_points_y[i] / _via_canvas_scale );
  }

  var polygon_region = new file_region();
  polygon_region.shape_attributes['name'] = region_shape;
  polygon_region.shape_attributes['all_points_x'] = all_points_x;
  polygon_region.shape_attributes['all_points_y'] = all_points_y;
  _via_img_metadata[img_id].regions[region_id] = polygon_region;

  // update canvas
  if ( img_id === _via_image_id ) {
    _via_canvas_regions[region_id].shape_attributes['name'] = region_shape;
    _via_canvas_regions[region_id].shape_attributes['all_points_x'] = canvas_all_points_x;
    _via_canvas_regions[region_id].shape_attributes['all_points_y'] = canvas_all_points_y;
  }
}

function del_sel_regions() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  if ( !_via_current_image_loaded ) {
    show_message('First load some images!');
    return;
  }

  var del_region_count = 0;
  if ( _via_is_all_region_selected ) {
    del_region_count = _via_canvas_regions.length;
    _via_canvas_regions.splice(0);
    _via_img_metadata[_via_image_id].regions.splice(0);
  } else {
    var sorted_sel_reg_id = [];
    for ( var i = 0; i < _via_canvas_regions.length; ++i ) {
      if ( _via_region_selected_flag[i] ) {
        sorted_sel_reg_id.push(i);
        _via_region_selected_flag[i] = false;
      }
    }
    sorted_sel_reg_id.sort( function(a,b) {
      return (b-a);
    });
    for ( var i = 0; i < sorted_sel_reg_id.length; ++i ) {
      _via_canvas_regions.splice( sorted_sel_reg_id[i], 1);
      _via_img_metadata[_via_image_id].regions.splice( sorted_sel_reg_id[i], 1);
      del_region_count += 1;
    }

    if ( sorted_sel_reg_id.length ) {
      _via_reg_canvas.style.cursor = "default";
    }
  }

  _via_is_all_region_selected = false;
  _via_is_region_selected     = false;
  _via_user_sel_region_id     = -1;

  if ( _via_canvas_regions.length === 0 ) {
    // all regions were deleted, hence clear region canvas
    _via_clear_reg_canvas();
  } else {
    _via_redraw_reg_canvas();
  }
  _via_reg_canvas.focus();
  annotation_editor_show();

  show_message('Deleted ' + del_region_count );
}

function sel_all_regions() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_group_toggle_select_all();
    return;
  }

  if (!_via_current_image_loaded) {
    show_message('First load some images!');
    return;
  }

  toggle_all_regions_selection(true);
  _via_is_all_region_selected = true;
  _via_redraw_reg_canvas();
}

function copy_sel_regions() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  if (!_via_current_image_loaded) {
    show_message('First load some images!');
    return;
  }

  if (_via_is_region_selected ||
      _via_is_all_region_selected) {
    _via_copied_image_regions.splice(0);
    for ( var i = 0; i < _via_img_metadata[_via_image_id].regions.length; ++i ) {
      var img_region = _via_img_metadata[_via_image_id].regions[i];
      var canvas_region = _via_canvas_regions[i];
      if ( _via_region_selected_flag[i] ) {
        _via_copied_image_regions.push( clone_image_region(img_region) );
      }
    }
    show_message('Copied ' + _via_copied_image_regions.length +
                 ' selected regions. Press Ctrl + v to paste');
  } else {
    show_message('Select a region first!');
  }
}

function paste_sel_regions_in_current_image() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  if ( !_via_current_image_loaded ) {
    show_message('First load some images!');
    return;
  }

  if ( _via_copied_image_regions.length ) {
    var pasted_reg_count = 0;
    for ( var i = 0; i < _via_copied_image_regions.length; ++i ) {
      // ensure copied the regions are within this image's boundaries
      var bbox = get_region_bounding_box( _via_copied_image_regions[i] );
      if (bbox[2] < _via_current_image_width &&
          bbox[3] < _via_current_image_height) {
        var r = clone_image_region(_via_copied_image_regions[i]);
        _via_img_metadata[_via_image_id].regions.push(r);

        pasted_reg_count += 1;
      }
    }
    _via_load_canvas_regions();
    var discarded_reg_count = _via_copied_image_regions.length - pasted_reg_count;
    show_message('Pasted ' + pasted_reg_count + ' regions. ' +
                 'Discarded ' + discarded_reg_count + ' regions exceeding image boundary.');
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
  } 
}

function paste_to_multiple_images_with_confirm() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  if ( _via_copied_image_regions.length === 0 ) {
    show_message('First copy some regions!');
    return;
  }

  var config = {'title':'Paste Regions to Multiple Images' };
  var input = { 'region_count': { type:'text', name:'Number of copied regions', value:_via_copied_image_regions.length, disabled:true },
                'prev_next_count':{ type:'text', name:'Copy to (count format)<br><span style="font-size:0.8rem">For example: to paste copied regions to the <i>previous 2 images</i> and <i>next 3 images</i>, type <strong>2,3</strong> in the textbox and to paste only in <i>next 5 images</i>, type <strong>0,5</strong></span>', placeholder:'2,3', disabled:false, size:30},
                'img_index_list':{ type:'text', name:'Copy to (image index list)<br><span style="font-size:0.8rem">For example: <strong>2-5,7,9</strong> pastes the copied regions to the images with the following id <i>2,3,4,5,7,9</i> and <strong>3,8,141</strong> pastes to the images with id <i>3,8 and 141</i></span>', placeholder:'2-5,7,9', disabled:false, size:30},
                'regex':{ type:'text', name:'Copy to filenames matching a regular expression<br><span style="font-size:0.8rem">For example: <strong>_large</strong> pastes the copied regions to all images whose filename contain the keyword <i>_large</i></span>', placeholder:'regular expression', disabled:false, size:30},
                'include_region_attributes':{ type:'checkbox', name:'Paste also the region annotations', checked:true},
              };

  invoke_with_user_inputs(paste_to_multiple_images_confirmed, input, config);
}

function paste_to_multiple_images_confirmed(input) {
  // keep a copy of user inputs for the undo operation
  _via_paste_to_multiple_images_input = input;
  var intersect = generate_img_index_list(input);
  var i;
  var total_pasted_region_count = 0;
  for ( i = 0; i < intersect.length; i++ ) {
    total_pasted_region_count += paste_regions( intersect[i] );
  }

  show_message('Pasted [' + total_pasted_region_count + '] regions ' +
               'in ' + intersect.length + ' images');

  if ( intersect.includes(_via_image_index) ) {
    _via_load_canvas_regions();
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
  }
  user_input_default_cancel_handler();
}

function paste_regions(img_index) {
  var pasted_reg_count = 0;
  if ( _via_copied_image_regions.length ) {
    var img_id = _via_image_id_list[img_index];
    var i;
    for ( i = 0; i < _via_copied_image_regions.length; ++i ) {
      var r = clone_image_region(_via_copied_image_regions[i]);
      _via_img_metadata[img_id].regions.push(r);

      pasted_reg_count += 1;
    }
  }
  return pasted_reg_count;
}


function del_sel_regions_with_confirm() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  if ( _via_copied_image_regions.length === 0 ) {
    show_message('First copy some regions!');
    return;
  }

  var prev_next_count, img_index_list, regex;
  if ( _via_paste_to_multiple_images_input ) {
    prev_next_count = _via_paste_to_multiple_images_input.prev_next_count.value;
    img_index_list  = _via_paste_to_multiple_images_input.img_index_list.value;
    regex = _via_paste_to_multiple_images_input.regex.value;
  }

  var config = {'title':'Undo Regions Pasted to Multiple Images' };
  var input = { 'region_count': { type:'text', name:'Number of regions selected', value:_via_copied_image_regions.length, disabled:true },
                'prev_next_count':{ type:'text', name:'Delete from (count format)<br><span style="font-size:0.8rem">For example: to delete copied regions from the <i>previous 2 images</i> and <i>next 3 images</i>, type <strong>2,3</strong> in the textbox and to delete regions only in <i>next 5 images</i>, type <strong>0,5</strong></span>', placeholder:'2,3', disabled:false, size:30, value:prev_next_count},
                'img_index_list':{ type:'text', name:'Delete from (image index list)<br><span style="font-size:0.8rem">For example: <strong>2-5,7,9</strong> deletes the copied regions to the images with the following id <i>2,3,4,5,7,9</i> and <strong>3,8,141</strong> deletes regions from the images with id <i>3,8 and 141</i></span>', placeholder:'2-5,7,9', disabled:false, size:30, value:img_index_list},
                'regex':{ type:'text', name:'Delete from filenames matching a regular expression<br><span style="font-size:0.8rem">For example: <strong>_large</strong> deletes the copied regions from all images whose filename contain the keyword <i>_large</i></span>', placeholder:'regular expression', disabled:false, size:30, value:regex},
              };

  invoke_with_user_inputs(del_sel_regions_confirmed, input, config);
}

function del_sel_regions_confirmed(input) {
  user_input_default_cancel_handler();
  var intersect = generate_img_index_list(input);
  var i;
  var total_deleted_region_count = 0;
  for ( i = 0; i < intersect.length; i++ ) {
    total_deleted_region_count += delete_regions( intersect[i] );
  }

  show_message('Deleted [' + total_deleted_region_count + '] regions ' +
               'in ' + intersect.length + ' images');

  if ( intersect.includes(_via_image_index) ) {
    _via_load_canvas_regions();
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
  }
}

function delete_regions(img_index) {
  var del_region_count = 0;
  if ( _via_copied_image_regions.length ) {
    var img_id = _via_image_id_list[img_index];
    var i;
    for ( i = 0; i < _via_copied_image_regions.length; ++i ) {
      var copied_region_shape_str = JSON.stringify(_via_copied_image_regions[i].shape_attributes);
      var j;
      // start from last region in order to delete the last pasted region
      for ( j = _via_img_metadata[img_id].regions.length-1; j >= 0; --j ) {
        if ( JSON.stringify(_via_img_metadata[img_id].regions[j].shape_attributes) === copied_region_shape_str ) {
          _via_img_metadata[img_id].regions.splice( j, 1);
          del_region_count += 1;
          break; // delete only one matching region
        }
      }
    }
  }
  return del_region_count;
}

function show_first_image() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_image_grid_group_var.length ) {
      image_grid_group_prev( { 'value':0 } ); // simulate button click
    } else {
      show_message('First, create groups by selecting items from "Group by" dropdown list');
    }
    return;
  }

  if (_via_img_count > 0) {
    _via_show_img( _via_img_fn_list_img_index_list[0] );
  }
}

function show_last_image() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_image_grid_group_var.length ) {
      image_grid_group_prev( { 'value':_via_image_grid_group_var.length-1 } ); // simulate button click
    } else {
      show_message('First, create groups by selecting items from "Group by" dropdown list');
    }
    return;
  }

  if (_via_img_count > 0) {
    var last_img_index = _via_img_fn_list_img_index_list.length - 1;
    _via_show_img( _via_img_fn_list_img_index_list[ last_img_index ] );
  }
}

function jump_image_block_get_count() {
  var n = _via_img_fn_list_img_index_list.length;
  if ( n < 20 ) {
    return 2;
  }
  if ( n < 100 ) {
    return 10;
  }
  if ( n < 1000 ) {
    return 25;
  }
  if ( n < 5000 ) {
    return 50;
  }
  if ( n < 10000 ) {
    return 100;
  }
  if ( n < 50000 ) {
    return 500;
  }

  return Math.round( n / 50 );
}

function jump_to_next_image_block() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  var jump_count = jump_image_block_get_count();
  if ( jump_count > 1 ) {
    var current_img_index = _via_image_index;
    if ( _via_img_fn_list_img_index_list.includes( current_img_index ) ) {
      var list_index = _via_img_fn_list_img_index_list.indexOf( current_img_index );
      var next_list_index = list_index + jump_count;
      if ( (next_list_index + 1) > _via_img_fn_list_img_index_list.length ) {
        next_list_index = 0;
      }
      var next_img_index = _via_img_fn_list_img_index_list[next_list_index];
      _via_show_img(next_img_index);
    }
  } else {
    move_to_next_image();
  }
}

function jump_to_prev_image_block() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    return;
  }

  var jump_count = jump_image_block_get_count();
  if ( jump_count > 1 ) {
    var current_img_index = _via_image_index;
    if ( _via_img_fn_list_img_index_list.includes( current_img_index ) ) {
      var list_index = _via_img_fn_list_img_index_list.indexOf( current_img_index );
      var prev_list_index = list_index - jump_count;
      if ( prev_list_index < 0 ) {
        prev_list_index = _via_img_fn_list_img_index_list.length - 1;
      }
      var prev_img_index = _via_img_fn_list_img_index_list[prev_list_index];
      _via_show_img(prev_img_index);
    }
  } else {
    move_to_prev_image();
  }
}

function move_to_prev_image() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_image_grid_group_var.length ) {
      var last_group_index = _via_image_grid_group_var.length - 1;
      image_grid_group_prev( { 'value':last_group_index } ); // simulate button click
    } else {
      show_message('First, create groups by selecting items from "Group by" dropdown list');
    }
    return;
  }

  if (_via_img_count > 0) {
    var current_img_index = _via_image_index;
    if ( _via_img_fn_list_img_index_list.includes( current_img_index ) ) {
      var list_index = _via_img_fn_list_img_index_list.indexOf( current_img_index );
      var next_list_index = list_index - 1;
      if ( next_list_index === -1 ) {
        next_list_index = _via_img_fn_list_img_index_list.length - 1;
      }
      var next_img_index = _via_img_fn_list_img_index_list[next_list_index];
      _via_show_img(next_img_index);
    } else {
      if ( _via_img_fn_list_img_index_list.length === 0 ) {
        show_message('Filtered file list does not any files!');
      } else {
        _via_show_img( _via_img_fn_list_img_index_list[0] );
      }
    }

    if (typeof _via_hook_prev_image === 'function') {
      _via_hook_prev_image(current_img_index);
    }
  }
}

function move_to_next_image() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_image_grid_group_var.length ) {
      var last_group_index = _via_image_grid_group_var.length - 1;
      image_grid_group_next( { 'value':last_group_index } ); // simulate button click
    } else {
      show_message('First, create groups by selecting items from "Group by" dropdown list');
    }
    return;
  }

  if (_via_img_count > 0) {
    var current_img_index = _via_image_index;
    if ( _via_img_fn_list_img_index_list.includes( current_img_index ) ) {
      var list_index = _via_img_fn_list_img_index_list.indexOf( current_img_index );
      var next_list_index = list_index + 1;
      if ( next_list_index === _via_img_fn_list_img_index_list.length ) {
        next_list_index = 0;
      }
      var next_img_index = _via_img_fn_list_img_index_list[next_list_index];
      _via_show_img(next_img_index);
    } else {
      if ( _via_img_fn_list_img_index_list.length === 0 ) {
        show_message('Filtered file list does not contain any files!');
      } else {
        _via_show_img( _via_img_fn_list_img_index_list[0] );
      }
    }

    if (typeof _via_hook_next_image === 'function') {
      _via_hook_next_image(current_img_index);
    }
  }
}

function set_zoom(zoom_level_index) {
  if ( zoom_level_index === VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX ) {
    _via_is_canvas_zoomed = false;
    _via_canvas_zoom_level_index = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX;
  } else {
    _via_is_canvas_zoomed = true;
    _via_canvas_zoom_level_index = zoom_level_index;
  }

  var zoom_scale = VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index];
  set_all_canvas_scale(zoom_scale);
  var canvas_w = ( _via_current_image.naturalWidth  * zoom_scale ) / _via_canvas_scale_without_zoom;
  var canvas_h = ( _via_current_image.naturalHeight * zoom_scale ) / _via_canvas_scale_without_zoom;
  set_all_canvas_size(canvas_w, canvas_h);
  _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;
  _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;

  if ( zoom_scale === 1 ) {
    VIA_REGION_POINT_RADIUS = VIA_REGION_POINT_RADIUS_DEFAULT;
  } else {
    if ( zoom_scale > 1 ) {
      VIA_REGION_POINT_RADIUS = VIA_REGION_POINT_RADIUS_DEFAULT * zoom_scale;
    }
  }

  _via_load_canvas_regions(); // image to canvas space transform
  _via_redraw_reg_canvas();
  _via_reg_canvas.focus();
  update_vertical_space();
}

function reset_zoom_level() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_image_size_reset();
    show_message('Zoom reset');
    return;
  }

  if (!_via_current_image_loaded) {
    show_message('First load some images!');
    return;
  }

  if (_via_is_canvas_zoomed) {
    set_zoom(VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX);
    show_message('Zoom reset');
  } else {
    show_message('Cannot reset zoom because image zoom has not been applied!');
  }
  update_vertical_space();
}

function zoom_in() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_image_size_increase();
    show_message('Increased size of images shown in image grid');
    return;
  }

  if (!_via_current_image_loaded) {
    show_message('First load some images!');
    return;
  }

  if ( _via_is_user_drawing_polygon || _via_is_user_drawing_region ) {
    return;
  }

  if (_via_canvas_zoom_level_index === (VIA_CANVAS_ZOOM_LEVELS.length-1)) {
    show_message('Further zoom-in not possible');
  } else {
    var new_zoom_level_index = _via_canvas_zoom_level_index + 1;
    set_zoom( new_zoom_level_index );
    show_message('Zoomed in to level ' + VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index] + 'X');
  }
}

function zoom_out() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_image_size_decrease();
    show_message('Reduced size of images shown in image grid');
    return;
  }

  if (!_via_current_image_loaded) {
    show_message('First load some images!');
    return;
  }

  if ( _via_is_user_drawing_polygon || _via_is_user_drawing_region ) {
    return;
  }

  if (_via_canvas_zoom_level_index === 0) {
    show_message('Further zoom-out not possible');
  } else {
    var new_zoom_level_index = _via_canvas_zoom_level_index - 1;
    set_zoom( new_zoom_level_index );
    show_message('Zoomed out to level ' + VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index] + 'X');
  }
}

function toggle_region_boundary_visibility() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE ) {
    _via_is_region_boundary_visible = !_via_is_region_boundary_visible;
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
  }

  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_settings.ui.image_grid.show_region_shape ) {
      _via_settings.ui.image_grid.show_region_shape = false;
      document.getElementById('image_grid_content_rshape').innerHTML = '';
    } else {
      _via_settings.ui.image_grid.show_region_shape = true;
      image_grid_page_show_all_regions();
    }
  }
}

function toggle_region_id_visibility() {
  _via_is_region_id_visible = !_via_is_region_id_visible;
  _via_redraw_reg_canvas();
  _via_reg_canvas.focus();
}

function toggle_region_info_visibility() {
  var elem = document.getElementById('region_info');
  // toggle between displaying and not displaying
  if ( elem.classList.contains('display_none') ) {
    elem.classList.remove('display_none');
    _via_is_region_info_visible = true;
  } else {
    elem.classList.add('display_none');
    _via_is_region_info_visible = false;
  }
}

//
// Mouse wheel event listener
//
function _via_reg_canvas_mouse_wheel_listener(e) {
  if (!_via_current_image_loaded) {
    return;
  }

  if ( e.ctrlKey ) {
    // perform zoom
    if (e.deltaY < 0) {
      zoom_in();
    } else {
      zoom_out();
    }
    e.preventDefault();
  }
}

function region_visualisation_update(type, default_id, next_offset) {
  var attr_list = [ default_id ];
  attr_list = attr_list.concat(Object.keys(_via_attributes['region']));
  var n = attr_list.length;
  var current_index = attr_list.indexOf(_via_settings.ui.image[type]);
  var new_index;
  if ( current_index !== -1 ) {
    new_index = current_index + next_offset;

    if ( new_index < 0 ) {
      new_index = n + new_index;
    }
    if ( new_index >= n ) {
      new_index = new_index - n;
    }
    switch(type) {
    case 'region_label':
      _via_settings.ui.image.region_label = attr_list[new_index];
      _via_redraw_reg_canvas();
      break;
    case 'region_color':
      _via_settings.ui.image.region_color = attr_list[new_index];
      _via_regions_group_color_init();
      _via_redraw_reg_canvas();
    }

    var type_str = type.replace('_', ' ');
    if ( _via_settings.ui.image[type].startsWith('__via') ) {
      show_message(type_str + ' cleared');
    } else {
      show_message(type_str + ' set to region attribute [' + _via_settings.ui.image[type] + ']');
    }
  }
}

//
// left sidebar toolbox maintainer
//
function leftsidebar_toggle() {
  var leftsidebar = document.getElementById('leftsidebar');
  if ( leftsidebar.style.display === 'none' ) {
    leftsidebar.style.display = 'table-cell';
    document.getElementById('leftsidebar_collapse_panel').style.display = 'none';
  } else {
    leftsidebar.style.display = 'none';
    document.getElementById('leftsidebar_collapse_panel').style.display = 'table-cell';
  }
  _via_update_ui_components();
}

function leftsidebar_increase_width() {
  var leftsidebar = document.getElementById('leftsidebar');
  var new_width = _via_settings.ui.leftsidebar_width + VIA_LEFTSIDEBAR_WIDTH_CHANGE;
  leftsidebar.style.width = new_width + 'rem';
  _via_settings.ui.leftsidebar_width = new_width;
  if ( _via_current_image_loaded ) {
    _via_show_img(_via_image_index);
  }
}

function leftsidebar_decrease_width() {
  var leftsidebar = document.getElementById('leftsidebar');
  var new_width = _via_settings.ui.leftsidebar_width - VIA_LEFTSIDEBAR_WIDTH_CHANGE;
  if ( new_width >= 5 ) {
    leftsidebar.style.width = new_width + 'rem';
    _via_settings.ui.leftsidebar_width = new_width;
    if ( _via_current_image_loaded ) {
      _via_show_img(_via_image_index);
    }
  }
}

function leftsidebar_show() {
  var leftsidebar = document.getElementById('leftsidebar');
  leftsidebar.style.display = 'table-cell';
  document.getElementById('leftsidebar_collapse_panel').style.display = 'none';
}

// source: https://www.w3schools.com/howto/howto_js_accordion.asp
function init_leftsidebar_accordion() {
  var leftsidebar = document.getElementById('leftsidebar');
  leftsidebar.style.width = _via_settings.ui.leftsidebar_width + 'rem';

  var acc = document.getElementsByClassName('leftsidebar_accordion');
  var i;
  for ( i = 0; i < acc.length; ++i ) {
    acc[i].addEventListener('click', function() {
      update_vertical_space();
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');

      switch( this.innerHTML ) {
      case 'Attributes':
        update_attributes_update_panel();
        break;
      case 'Project':
        update_img_fn_list();
        break;
      }
    });
  }
}

//
// image filename list shown in leftsidebar panel
//
function is_img_fn_list_visible() {
  return img_fn_list_panel.classList.contains('show');
}

function img_loading_spinbar(image_index, show) {
  var panel = document.getElementById('project_panel_title');
  if ( show ) {
    panel.innerHTML = 'Project <span style="margin-left:1rem;" class="loading_spinbox"></span>';
  } else {
    panel.innerHTML = 'Project';
  }
}

function update_img_fn_list() {
  var regex = document.getElementById('img_fn_list_regex').value;
  var p = document.getElementById('filelist_preset_filters_list');
  if ( regex === '' || regex === null ) {
    if ( p.selectedIndex === 0 ) {
      // show all files
      _via_img_fn_list_html = [];
      _via_img_fn_list_img_index_list = [];
      _via_img_fn_list_html.push('<ul>');
      for ( var i=0; i < _via_image_filename_list.length; ++i ) {
        _via_img_fn_list_html.push( img_fn_list_ith_entry_html(i) );
        _via_img_fn_list_img_index_list.push(i);
      }
      _via_img_fn_list_html.push('</ul>');
      img_fn_list.innerHTML = _via_img_fn_list_html.join('');
      img_fn_list_scroll_to_current_file();
    } else {
      // filter according to preset filters
      img_fn_list_onpresetfilter_select();
    }
  } else {
    img_fn_list_generate_html(regex);
    img_fn_list.innerHTML = _via_img_fn_list_html.join('');
    img_fn_list_scroll_to_current_file();
  }
}

function img_fn_list_onregex() {
  var regex = document.getElementById('img_fn_list_regex').value;
  img_fn_list_generate_html( regex );
  img_fn_list.innerHTML = _via_img_fn_list_html.join('');
  img_fn_list_scroll_to_current_file();

  // select 'regex' in the predefined filter list
  var p = document.getElementById('filelist_preset_filters_list');
  if ( regex === '' ) {
    p.selectedIndex = 0;
  } else {
    var i;
    for ( i=0; i<p.options.length; ++i ) {
      if ( p.options[i].value === 'regex' ) {
        p.selectedIndex = i;
        break;
      }
    }
  }
}

function img_fn_list_onpresetfilter_select() {
  var p = document.getElementById('filelist_preset_filters_list');
  var filter = p.options[p.selectedIndex].value;
  switch(filter) {
  case 'all':
    document.getElementById('img_fn_list_regex').value = '';
    img_fn_list_generate_html();
    img_fn_list.innerHTML = _via_img_fn_list_html.join('');
    img_fn_list_scroll_to_current_file();
    break;
  case 'regex':
    document.getElementById('img_fn_list_regex').focus();
    break;
  default:
    _via_img_fn_list_html = [];
    _via_img_fn_list_img_index_list = [];
    _via_img_fn_list_html.push('<ul>');
    var i;
    for ( i=0; i < _via_image_filename_list.length; ++i ) {
      var img_id = _via_image_id_list[i];
      var add_to_list = false;
      switch(filter) {
      case 'files_without_region':
        if ( _via_img_metadata[img_id].regions.length === 0 ) {
          add_to_list = true;
        }
        break;
      case 'files_missing_region_annotations':
        if ( is_region_annotation_missing(img_id) ) {
          add_to_list = true;
        }
        break;
      case 'files_missing_file_annotations':
        if ( is_file_annotation_missing(img_id) ) {
          add_to_list = true;
        }
        break;
      case 'files_error_loading':
        if ( _via_image_load_error[i] === true ) {
          add_to_list = true;
        }
      }
      if ( add_to_list ) {
        _via_img_fn_list_html.push( img_fn_list_ith_entry_html(i) );
        _via_img_fn_list_img_index_list.push(i);
      }
    }
    _via_img_fn_list_html.push('</ul>');
    img_fn_list.innerHTML = _via_img_fn_list_html.join('');
    img_fn_list_scroll_to_current_file();
    break;
  }
}

function is_region_annotation_missing(img_id) {
  var region_attribute;
  var i;
  for ( i = 0; i < _via_img_metadata[img_id].regions.length; ++i ) {
    for ( region_attribute in _via_attributes['region'] ) {
      if ( _via_img_metadata[img_id].regions[i].region_attributes.hasOwnProperty(region_attribute) ) {
        if ( _via_img_metadata[img_id].regions[i].region_attributes[region_attribute] === '' ) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
}

function is_file_annotation_missing(img_id) {
  var file_attribute;
  for ( file_attribute in _via_attributes['file'] ) {
    if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty(file_attribute) ) {
      if ( _via_img_metadata[img_id].file_attributes[file_attribute] === '' ) {
        return true;
      }
    } else {
      return true;
    }
  }
  return false;
}

function img_fn_list_ith_entry_selected(img_index, is_selected) {
  if ( is_selected ) {
    img_fn_list_ith_entry_add_css_class(img_index, 'sel');
  } else {
    img_fn_list_ith_entry_remove_css_class(img_index, 'sel');
  }
}

function img_fn_list_ith_entry_error(img_index, is_error) {
  if ( is_error ) {
    img_fn_list_ith_entry_add_css_class(img_index, 'error');
  } else {
    img_fn_list_ith_entry_remove_css_class(img_index, 'error');
  }
}

function img_fn_list_ith_entry_add_css_class(img_index, classname) {
  var li = document.getElementById('fl' + img_index);
  if ( li && ! li.classList.contains(classname)  ) {
    li.classList.add(classname);
  }
}

function img_fn_list_ith_entry_remove_css_class(img_index, classname) {
  var li = document.getElementById('fl' + img_index);
  if ( li && li.classList.contains(classname) ) {
    li.classList.remove(classname);
  }
}

function img_fn_list_clear_all_style() {
  var cn = document.getElementById('img_fn_list').childNodes[0].childNodes;
  var i, j;
  var n = cn.length;
  var nclass;
  for ( i = 0; i < n; ++i ) {
    //cn[i].classList = []; // throws error in Edge browser
    nclass = cn[i].classList.length;
    if ( nclass ) {
      for ( j = 0; j < nclass; ++j ) {
        cn[i].classList.remove( cn[i].classList.item(j) );
      }
    }
  }
}

function img_fn_list_clear_css_classname(classname) {
  var cn = document.getElementById('img_fn_list').childNodes[0].childNodes;
  var i;
  var n = cn.length;
  for ( i = 0; i < n; ++i ) {
    if ( cn[i].classList.contains(classname) ) {
      cn[i].classList.remove(classname);
    }
  }
}

function img_fn_list_ith_entry_html(i) {
  var htmli = '';
  var filename = _via_image_filename_list[i];
  if ( is_url(filename) ) {
    filename = filename.substr(0,4) + '...' + get_filename_from_url(filename);
  }

  htmli += '<li id="fl' + i + '"';
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( _via_image_grid_page_img_index_list.includes(i) ) {
      // highlight images being shown in image grid
      htmli += ' class="sel"';
    }

  } else {
    if ( i === _via_image_index ) {
      // highlight the current entry
      htmli += ' class="sel"';
    }
  }
  htmli += ' onclick="jump_to_image(' + (i) + ')" title="' + _via_image_filename_list[i] + '">[' + (i+1) + '] ' + decodeURIComponent(filename) + '</li>';
  return htmli;
}

function img_fn_list_generate_html(regex) {
  _via_img_fn_list_html = [];
  _via_img_fn_list_img_index_list = [];
  _via_img_fn_list_html.push('<ul>');
  for ( var i=0; i < _via_image_filename_list.length; ++i ) {
    var filename = _via_image_filename_list[i];
    if ( filename.match(regex) !== null ) {
      _via_img_fn_list_html.push( img_fn_list_ith_entry_html(i) );
      _via_img_fn_list_img_index_list.push(i);
    }
  }
  _via_img_fn_list_html.push('</ul>');
}

function img_fn_list_scroll_to_current_file() {
  img_fn_list_scroll_to_file( _via_image_index );
}

function img_fn_list_scroll_to_file(file_index) {
  if( _via_img_fn_list_img_index_list.includes(file_index) ) {
    var sel_file     = document.getElementById( 'fl' + file_index );
    var panel_height = img_fn_list.clientHeight - 20;
    var window_top    = img_fn_list.scrollTop;
    var window_bottom = img_fn_list.scrollTop + panel_height
    if ( sel_file.offsetTop > window_top ) {
      if ( sel_file.offsetTop > window_bottom ) {
        img_fn_list.scrollTop = sel_file.offsetTop;
      }
    } else {
      img_fn_list.scrollTop = sel_file.offsetTop - panel_height;
    }
  }
}

function toggle_img_fn_list_visibility() {
  leftsidebar_show();
  document.getElementById('img_fn_list_panel').classList.toggle('show');
  document.getElementById('project_panel_title').classList.toggle('active');
}

function toggle_attributes_editor() {
  leftsidebar_show();
  document.getElementById('attributes_editor_panel').classList.toggle('show');
  document.getElementById('attributes_editor_panel_title').classList.toggle('active');
}

// this vertical spacer is needed to allow scrollbar to show
// items like Keyboard Shortcut hidden under the attributes panel
function update_vertical_space() {
  var panel = document.getElementById('vertical_space');
  var aepanel = document.getElementById('annotation_editor_panel');
  panel.style.height = (aepanel.offsetHeight + 40) + 'px';
}

//
// region and file attributes update panel
//
function attribute_update_panel_set_active_button() {
  var attribute_type;
  for ( attribute_type in _via_attributes ) {
    var bid = 'button_show_' + attribute_type + '_attributes';
    document.getElementById(bid).classList.remove('active');
  }
  var bid = 'button_show_' + _via_attribute_being_updated + '_attributes';
  document.getElementById(bid).classList.add('active');
}

function show_region_attributes_update_panel() {
  _via_attribute_being_updated = 'region';
  var rattr_list = Object.keys(_via_attributes['region']);
  if ( rattr_list.length ) {
    _via_current_attribute_id = rattr_list[0];
  } else {
    _via_current_attribute_id = '';
  }
  update_attributes_update_panel();
  attribute_update_panel_set_active_button();

}

function show_file_attributes_update_panel() {
  _via_attribute_being_updated = 'file';
  var fattr_list = Object.keys(_via_attributes['file']);
  if ( fattr_list.length ) {
    _via_current_attribute_id = fattr_list[0];
  } else {
    _via_current_attribute_id = '';
  }
  update_attributes_update_panel();
  attribute_update_panel_set_active_button();
}

function update_attributes_name_list() {
  var p = document.getElementById('attributes_name_list');
  p.innerHTML = '';

  var attr;
  for ( attr in _via_attributes[_via_attribute_being_updated] ) {
    var option = document.createElement('option');
    option.setAttribute('value', attr)
    option.innerHTML = attr;
    if ( attr === _via_current_attribute_id ) {
      option.setAttribute('selected', 'selected');
    }
    p.appendChild(option);
  }
}

function update_attributes_update_panel() {
  if ( document.getElementById('attributes_editor_panel').classList.contains('show') ) {
    update_attributes_name_list();
    show_attribute_properties();
    show_attribute_options();
  }
}

function update_attribute_properties_panel() {
  if ( document.getElementById('attributes_editor_panel').classList.contains('show') ) {
    show_attribute_properties();
    show_attribute_options();
  }
}

function show_attribute_properties() {
  var attr_list = document.getElementById('attributes_name_list');
  document.getElementById('attribute_properties').innerHTML = '';

  if ( attr_list.options.length === 0 ) {
    return;
  }

  if ( typeof(_via_current_attribute_id) === 'undefined' || _via_current_attribute_id === '' ) {
    _via_current_attribute_id = attr_list.options[0].value;
  }

  var attr_id = _via_current_attribute_id;
  var attr_type = _via_attribute_being_updated;
  var attr_input_type = _via_attributes[attr_type][attr_id].type;
  var attr_desc = _via_attributes[attr_type][attr_id].description;

  attribute_property_add_input_property('Name of attribute (appears in exported annotations)',
                                        'Name',
                                        attr_id,
                                        'attribute_name');
  attribute_property_add_input_property('Description of attribute (shown to user during annotation session)',
                                        'Desc.',
                                        attr_desc,
                                        'attribute_description');

  if ( attr_input_type === 'text' ) {
    var attr_default_value = _via_attributes[attr_type][attr_id].default_value;
    attribute_property_add_input_property('Default value of this attribute',
                                          'Def.',
                                          attr_default_value,
                                          'attribute_default_value');
  }

  // add dropdown for type of attribute
  var p = document.createElement('div');
  p.setAttribute('class', 'property');
  var c0 = document.createElement('span');
  c0.setAttribute('title', 'Attribute type (e.g. text, checkbox, radio, etc)');
  c0.innerHTML = 'Type';
  var c1 = document.createElement('span');
  var c1b = document.createElement('select');
  c1b.setAttribute('onchange', 'attribute_property_on_update(this)');
  c1b.setAttribute('id', 'attribute_type');
  var type_id;
  for ( type_id in VIA_ATTRIBUTE_TYPE ) {
    var type = VIA_ATTRIBUTE_TYPE[type_id];
    var option = document.createElement('option');
    option.setAttribute('value', type);
    option.innerHTML = type;
    if ( attr_input_type == type ) {
      option.setAttribute('selected', 'selected');
    }
    c1b.appendChild(option);
  }
  c1.appendChild(c1b);
  p.appendChild(c0);
  p.appendChild(c1);
  document.getElementById('attribute_properties').appendChild(p);
}

function show_attribute_options() {
  var attr_list = document.getElementById('attributes_name_list');
  document.getElementById('attribute_options').innerHTML = '';
  if ( attr_list.options.length === 0 ) {
    return;
  }

  var attr_id = attr_list.value;
  var attr_type = _via_attributes[_via_attribute_being_updated][attr_id].type;

  // populate additional options based on attribute type
  switch( attr_type ) {
  case VIA_ATTRIBUTE_TYPE.TEXT:
    // text does not have any additional properties
    break;
  case VIA_ATTRIBUTE_TYPE.IMAGE:
    var p = document.createElement('div');
    p.setAttribute('class', 'property');
    p.setAttribute('style', 'text-align:center');
    var c0 = document.createElement('span');
    c0.setAttribute('style', 'width:25%');
    c0.setAttribute('title', 'When selected, this is the value that appears in exported annotations');
    c0.innerHTML = 'id';
    var c1 = document.createElement('span');
    c1.setAttribute('style', 'width:60%');
    c1.setAttribute('title', 'URL or base64 (see https://www.base64-image.de/) encoded image data that corresponds to the image shown as an option to the annotator');
    c1.innerHTML = 'image url or b64';
    var c2 = document.createElement('span');
    c2.setAttribute('title', 'The default value of this attribute');
    c2.innerHTML = 'def.';
    p.appendChild(c0);
    p.appendChild(c1);
    p.appendChild(c2);
    document.getElementById('attribute_options').appendChild(p);

    var options = _via_attributes[_via_attribute_being_updated][attr_id].options;
    var option_id;
    for ( option_id in options ) {
      var option_desc = options[option_id];

      var option_default = _via_attributes[_via_attribute_being_updated][attr_id].default_options[option_id];
      attribute_property_add_option(attr_id, option_id, option_desc, option_default, attr_type);
    }
    attribute_property_add_new_entry_option(attr_id, attr_type);
    break;
  case VIA_ATTRIBUTE_TYPE.CHECKBOX: // handled by next case
  case VIA_ATTRIBUTE_TYPE.DROPDOWN: // handled by next case
  case VIA_ATTRIBUTE_TYPE.RADIO:
    var p = document.createElement('div');
    p.setAttribute('class', 'property');
    p.setAttribute('style', 'text-align:center');
    var c0 = document.createElement('span');
    c0.setAttribute('style', 'width:25%');
    c0.setAttribute('title', 'When selected, this is the value that appears in exported annotations');
    c0.innerHTML = 'id';
    var c1 = document.createElement('span');
    c1.setAttribute('style', 'width:60%');
    c1.setAttribute('title', 'This is the text shown as an option to the annotator');
    c1.innerHTML = 'description';
    var c2 = document.createElement('span');
    c2.setAttribute('title', 'The default value of this attribute');
    c2.innerHTML = 'def.';
    p.appendChild(c0);
    p.appendChild(c1);
    p.appendChild(c2);
    document.getElementById('attribute_options').appendChild(p);

    var options = _via_attributes[_via_attribute_being_updated][attr_id].options;
    var option_id;
    for ( option_id in options ) {
      var option_desc = options[option_id];

      var option_default = _via_attributes[_via_attribute_being_updated][attr_id].default_options[option_id];
      attribute_property_add_option(attr_id, option_id, option_desc, option_default, attr_type);
    }
    attribute_property_add_new_entry_option(attr_id, attr_type);
    break;
  default:
    console.log('Attribute type ' + attr_type + ' is unavailable');
  }
}

function attribute_property_add_input_property(title, name, value, id) {
  var p = document.createElement('div');
  p.setAttribute('class', 'property');
  var c0 = document.createElement('span');
  c0.setAttribute('title', title);
  c0.innerHTML = name;
  var c1 = document.createElement('span');
  var c1b = document.createElement('input');
  c1b.setAttribute('onchange', 'attribute_property_on_update(this)');
  if ( typeof(value) !== 'undefined' ) {
    c1b.setAttribute('value', value);
  }
  c1b.setAttribute('id', id);
  c1.appendChild(c1b);
  p.appendChild(c0);
  p.appendChild(c1);

  document.getElementById('attribute_properties').appendChild(p);
}

function attribute_property_add_option(attr_id, option_id, option_desc, option_default, attribute_type) {
  var p = document.createElement('div');
  p.setAttribute('class', 'property');
  var c0 = document.createElement('span');
  var c0b = document.createElement('input');
  c0b.setAttribute('type', 'text');
  c0b.setAttribute('value', option_id);
  c0b.setAttribute('title', option_id);
  c0b.setAttribute('onchange', 'attribute_property_on_option_update(this)');
  c0b.setAttribute('id', '_via_attribute_option_id_' + option_id);

  var c1 = document.createElement('span');
  var c1b = document.createElement('input');
  c1b.setAttribute('type', 'text');

  if ( attribute_type === VIA_ATTRIBUTE_TYPE.IMAGE ) {
    var option_desc_info = option_desc.length + ' bytes of base64 image data';
    c1b.setAttribute('value', option_desc_info);
    c1b.setAttribute('title', 'To update, copy and paste base64 image data in this text box');
  } else {
    c1b.setAttribute('value', option_desc);
    c1b.setAttribute('title', option_desc);
  }
  c1b.setAttribute('onchange', 'attribute_property_on_option_update(this)');
  c1b.setAttribute('id', '_via_attribute_option_description_' + option_id);

  var c2 = document.createElement('span');
  var c2b = document.createElement('input');
  c2b.setAttribute('type', attribute_type);
  if ( typeof option_default !== 'undefined' ) {
    c2b.checked = option_default;
  }
  if ( attribute_type === 'radio' || attribute_type === 'image' || attribute_type === 'dropdown' ) {
    // ensured that user can activate only one radio button
    c2b.setAttribute('type', 'radio');
    c2b.setAttribute('name', attr_id);
  }

  c2b.setAttribute('onchange', 'attribute_property_on_option_update(this)');
  c2b.setAttribute('id', '_via_attribute_option_default_' + option_id);

  c0.appendChild(c0b);
  c1.appendChild(c1b);
  c2.appendChild(c2b);
  p.appendChild(c0);
  p.appendChild(c1);
  p.appendChild(c2);

  document.getElementById('attribute_options').appendChild(p);
}

function attribute_property_add_new_entry_option(attr_id, attribute_type) {
  var p = document.createElement('div');
  p.setAttribute('class', 'new_option_id_entry');
  var c0b = document.createElement('input');
  c0b.setAttribute('type', 'text');
  c0b.setAttribute('onchange', 'attribute_property_on_option_add(this)');
  c0b.setAttribute('id', '_via_attribute_new_option_id');
  c0b.setAttribute('placeholder', 'Add new option id');
  p.appendChild(c0b);
  document.getElementById('attribute_options').appendChild(p);
}

function attribute_property_on_update(p) {
  var attr_id = get_current_attribute_id();
  var attr_type = _via_attribute_being_updated;
  var new_attr_type = p.value;

  switch(p.id) {
  case 'attribute_name':
    if ( new_attr_type !== attr_id ) {
      Object.defineProperty(_via_attributes[attr_type],
                            new_attr_type,
                            Object.getOwnPropertyDescriptor(_via_attributes[attr_type], attr_id));

      delete _via_attributes[attr_type][attr_id];
      update_attributes_update_panel();
      annotation_editor_update_content();
    }
    break;
  case 'attribute_description':
    _via_attributes[attr_type][attr_id].description = new_attr_type;
    update_attributes_update_panel();
    annotation_editor_update_content();
    break;
  case 'attribute_default_value':
    _via_attributes[attr_type][attr_id].default_value = new_attr_type;
    update_attributes_update_panel();
    annotation_editor_update_content();
    break;
  case 'attribute_type':
    var old_attr_type = _via_attributes[attr_type][attr_id].type;
    _via_attributes[attr_type][attr_id].type = new_attr_type;
    if( new_attr_type === VIA_ATTRIBUTE_TYPE.TEXT ) {
      _via_attributes[attr_type][attr_id].default_value = '';
      delete _via_attributes[attr_type][attr_id].options;
      delete _via_attributes[attr_type][attr_id].default_options;
    } else {
      // add options entry (if missing)
      if ( ! _via_attributes[attr_type][attr_id].hasOwnProperty('options') ) {
        _via_attributes[attr_type][attr_id].options = {};
        _via_attributes[attr_type][attr_id].default_options = {};
      }
      if ( _via_attributes[attr_type][attr_id].hasOwnProperty('default_value') ) {
        delete _via_attributes[attr_type][attr_id].default_value;
      }

      // 1. gather all the attribute values in existing metadata
      var existing_attr_values = attribute_get_unique_values(attr_type, attr_id);

      // 2. for checkbox, radio, dropdown: create options based on existing options and existing values
      for(var option_id in _via_attributes[attr_type][attr_id]['options']) {
        if( !existing_attr_values.includes(option_id) ) {
          _via_attributes[attr_type][attr_id]['options'][option_id] = option_id;
        }
      }

      // update existing metadata to reflect changes in attribute type
      // ensure that attribute has only one value
      for(var img_id in _via_img_metadata ) {
        for(var rindex in _via_img_metadata[img_id]['regions']) {
          if(_via_img_metadata[img_id]['regions'][rindex]['region_attributes'].hasOwnProperty(attr_id)) {
            if(old_attr_type === VIA_ATTRIBUTE_TYPE.CHECKBOX &&
               (new_attr_type === VIA_ATTRIBUTE_TYPE.RADIO ||
                new_attr_type === VIA_ATTRIBUTE_TYPE.DROPDOWN) ) {
              // add only if checkbox has only single option selected
              var sel_option_count = 0;
              var sel_option_id;
              for(var option_id in _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id]) {
                if(_via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id][option_id]) {
                  sel_option_count = sel_option_count + 1;
                  sel_option_id = option_id;
                }
              }
              if(sel_option_count === 1) {
                _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id] = sel_option_id;
              } else {
                // delete as multiple options cannot be represented as radio or dropdown
                delete _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id];
              }
            }
            if( (old_attr_type === VIA_ATTRIBUTE_TYPE.RADIO ||
                 old_attr_type === VIA_ATTRIBUTE_TYPE.DROPDOWN) &&
                new_attr_type === VIA_ATTRIBUTE_TYPE.CHECKBOX) {
              var old_option_id = _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id];
              _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id] = {};
              _via_img_metadata[img_id]['regions'][rindex]['region_attributes'][attr_id][old_option_id] = true;
            }
          }
        }
      }
    }
    show_attribute_properties();
    show_attribute_options();
    annotation_editor_update_content();
    break;
  }
}

function attribute_get_unique_values(attr_type, attr_id) {
  var values = [];
  switch ( attr_type ) {
  case 'file':
    var img_id, attr_val;
    for ( img_id in _via_img_metadata ) {
      if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty(attr_id) ) {
        attr_val = _via_img_metadata[img_id].file_attributes[attr_id];
        if ( ! values.includes(attr_val) ) {
          values.push(attr_val);
        }
      }
    }
    break;
  case 'region':
    var img_id, attr_val, i;
    for ( img_id in _via_img_metadata ) {
      for ( i = 0; i < _via_img_metadata[img_id].regions.length; ++i ) {
        if ( _via_img_metadata[img_id].regions[i].region_attributes.hasOwnProperty(attr_id) ) {
          attr_val = _via_img_metadata[img_id].regions[i].region_attributes[attr_id];
          if( typeof(attr_val) === 'object' ) {
            for(var option_id in _via_img_metadata[img_id].regions[i].region_attributes[attr_id]) {
              if ( ! values.includes(option_id) ) {
                values.push(option_id);
              }
            }
          } else {
            if ( ! values.includes(attr_val) ) {
              values.push(attr_val);
            }
          }
        }
      }
    }
    break;
  default:
    break;
  }
  return values;
}

function attribute_property_on_option_update(p) {
  var attr_id = get_current_attribute_id();
  if ( p.id.startsWith('_via_attribute_option_id_') ) {
    var old_key = p.id.substr( '_via_attribute_option_id_'.length );
    var new_key = p.value;
    if ( old_key !== new_key ) {
      var option_id_test = attribute_property_option_id_is_valid(attr_id, new_key);
      if ( option_id_test.is_valid ) {
        update_attribute_option_id_with_confirm(_via_attribute_being_updated,
                                                attr_id,
                                                old_key,
                                                new_key);
      } else {
        p.value = old_key; // restore old value
        show_message( option_id_test.message );
        show_attribute_properties();
      }
      return;
    }
  }

  if ( p.id.startsWith('_via_attribute_option_description_') ) {
    var key = p.id.substr( '_via_attribute_option_description_'.length );
    var old_value = _via_attributes[_via_attribute_being_updated][attr_id].options[key];
    var new_value = p.value;
    if ( new_value !== old_value ) {
      _via_attributes[_via_attribute_being_updated][attr_id].options[key] = new_value;
      show_attribute_properties();
      annotation_editor_update_content();
    }
  }

  if ( p.id.startsWith('_via_attribute_option_default_') ) {
    var new_default_option_id = p.id.substr( '_via_attribute_option_default_'.length );
    var old_default_option_id_list = Object.keys(_via_attributes[_via_attribute_being_updated][attr_id].default_options);

    if ( old_default_option_id_list.length === 0 ) {
      // default set for the first time
      _via_attributes[_via_attribute_being_updated][attr_id].default_options[new_default_option_id] = p.checked;
    } else {
      switch ( _via_attributes[_via_attribute_being_updated][attr_id].type ) {
      case 'image':    // fallback
      case 'dropdown': // fallback
      case 'radio':    // fallback
        // to ensure that only one radio button is selected at a time
        _via_attributes[_via_attribute_being_updated][attr_id].default_options = {};
        _via_attributes[_via_attribute_being_updated][attr_id].default_options[new_default_option_id] = p.checked;
        break;
      case 'checkbox':
        _via_attributes[_via_attribute_being_updated][attr_id].default_options[new_default_option_id] = p.checked;
        break;
      }
    }
    // default option updated
    attribute_property_on_option_default_update(_via_attribute_being_updated,
                                                attr_id,
                                                new_default_option_id).then( function() {
                                                  show_attribute_properties();
                                                  annotation_editor_update_content();
                                                });
  }
}

function attribute_property_on_option_default_update(attribute_being_updated, attr_id, new_default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    // set all metadata to new_value if:
    // - metadata[attr_id] is missing
    // - metadata[attr_id] is set to option_old_value
    var img_id, attr_value, n, i;
    var attr_type = _via_attributes[attribute_being_updated][attr_id].type;
    switch( attribute_being_updated ) {
    case 'file':
      for ( img_id in _via_img_metadata ) {
        if ( ! _via_img_metadata[img_id].file_attributes.hasOwnProperty(attr_id) ) {
          _via_img_metadata[img_id].file_attributes[attr_id] = new_default_option_id;
        }
      }
      break;
    case 'region':
      for ( img_id in _via_img_metadata ) {
        n = _via_img_metadata[img_id].regions.length;
        for ( i = 0; i < n; ++i ) {
          if ( ! _via_img_metadata[img_id].regions[i].region_attributes.hasOwnProperty(attr_id) ) {
            _via_img_metadata[img_id].regions[i].region_attributes[attr_id] = new_default_option_id;
          }
        }
      }
      break;
    }
    ok_callback();
  });
}

function attribute_property_on_option_add(p) {
  if ( p.value === '' || p.value === null ) {
    return;
  }

  if ( p.id === '_via_attribute_new_option_id' ) {
    var attr_id = get_current_attribute_id();
    var option_id = p.value;
    var option_id_test = attribute_property_option_id_is_valid(attr_id, option_id);
    if ( option_id_test.is_valid ) {
      _via_attributes[_via_attribute_being_updated][attr_id].options[option_id] = '';
      show_attribute_options();
      annotation_editor_update_content();
    } else {
      show_message( option_id_test.message );
      attribute_property_reset_new_entry_inputs();
    }
  }
}

function attribute_property_reset_new_entry_inputs() {
  var container = document.getElementById('attribute_options');
  var p = container.lastChild;
  if ( p.childNodes[0] ) {
    p.childNodes[0].value = '';
  }
  if ( p.childNodes[1] ) {
    p.childNodes[1].value = '';
  }
}

function attribute_property_show_new_entry_inputs(attr_id, attribute_type) {
  var n0 = document.createElement('div');
  n0.classList.add('property');
  var n1a = document.createElement('span');
  var n1b = document.createElement('input');
  n1b.setAttribute('onchange', 'attribute_property_on_option_add(this)');
  n1b.setAttribute('placeholder', 'Add new id');
  n1b.setAttribute('value', '');
  n1b.setAttribute('id', '_via_attribute_new_option_id');
  n1a.appendChild(n1b);

  var n2a = document.createElement('span');
  var n2b = document.createElement('input');
  n2b.setAttribute('onchange', 'attribute_property_on_option_add(this)');
  n2b.setAttribute('placeholder', 'Optional description');
  n2b.setAttribute('value', '');
  n2b.setAttribute('id', '_via_attribute_new_option_description');
  n2a.appendChild(n2b);

  var n3a = document.createElement('span');
  var n3b = document.createElement('input');
  n3b.setAttribute('type', attribute_type);
  if ( attribute_type === 'radio' ) {
    n3b.setAttribute('name', attr_id);
  }
  n3b.setAttribute('onchange', 'attribute_property_on_option_add(this)');
  n3b.setAttribute('id', '_via_attribute_new_option_default');
  n3a.appendChild(n3b);

  n0.appendChild(n1a);
  n0.appendChild(n2a);
  n0.appendChild(n3a);

  var container = document.getElementById('attribute_options');
  container.appendChild(n0);
}

function attribute_property_option_id_is_valid(attr_id, new_option_id) {
  var option_id;
  for ( option_id in _via_attributes[_via_attribute_being_updated][attr_id].options ) {
    if ( option_id === new_option_id ) {
      return { 'is_valid':false, 'message':'Class Create' };
    }
  }

  if ( new_option_id.includes('__') ) { // reserved separator for attribute-id, row-id, option-id
    return {'is_valid':false, 'message':'Option id cannot contain two consecutive underscores'};
  }

  return {'is_valid':true};
}

function attribute_property_id_exists(name) {
  var attr_name;
  for ( attr_name in _via_attributes[_via_attribute_being_updated] ) {
    if ( attr_name === name ) {
      return true;
    }
  }
  return false;
}

function delete_existing_attribute_with_confirm() {
  var attr_id = document.getElementById('user_input_attribute_id').value;
  if ( attr_id === '' ) {
    show_message('Class Created');
    return;
  }
  if ( attribute_property_id_exists(attr_id) ) {
    var config = {'title':'Delete ' + _via_attribute_being_updated + ' attribute [' + attr_id + ']',
                  'warning': 'Warning: Deleting an attribute will lead to the attribute being deleted in all the annotations. Please click OK only if you are sure.'};
    var input = { 'attr_type':{'type':'text', 'name':'Attribute Type', 'value':_via_attribute_being_updated, 'disabled':true},
                  'attr_id':{'type':'text', 'name':'Attribute Id', 'value':attr_id, 'disabled':true}
                };
    invoke_with_user_inputs(delete_existing_attribute_confirmed, input, config);
  } else {
    show_message('Attribute [' + attr_id + '] does not exist!');
    return;
  }
}

function delete_existing_attribute_confirmed(input) {
  var attr_type = input.attr_type.value;
  var attr_id   = input.attr_id.value;
  delete_existing_attribute(attr_type, attr_id);
  document.getElementById('user_input_attribute_id').value = '';
  show_message('Deleted ' + attr_type + ' attribute [' + attr_id + ']');
  user_input_default_cancel_handler();
}

function delete_existing_attribute(attribute_type, attr_id) {
  if ( _via_attributes[attribute_type].hasOwnProperty( attr_id ) ) {
    var attr_id_list = Object.keys(_via_attributes[attribute_type]);
    if ( attr_id_list.length === 1 ) {
      _via_current_attribute_id = '';
    } else {
      var current_index = attr_id_list.indexOf(attr_id);
      var next_index = current_index + 1;
      if ( next_index === attr_id_list.length ) {
        next_index = current_index - 1;
      }
      _via_current_attribute_id = attr_id_list[next_index];
    }
    delete _via_attributes[attribute_type][attr_id];
    delete_region_attribute_in_all_metadata(attr_id);
    update_attributes_update_panel();
    annotation_editor_update_content();
  }
}

function add_new_attribute_from_user_input() {
  var attr_id = document.getElementById('user_input_attribute_id').value;
  if ( attr_id === '' ) {
    show_message('Classes Created');
    return;
  }

  if ( attribute_property_id_exists(attr_id) ) {
    show_message('The ' + _via_attribute_being_updated + ' attribute [' + attr_id + '] already exists.');
  } else {
    _via_current_attribute_id = attr_id;
    add_new_attribute(attr_id);
    update_attributes_update_panel();
    annotation_editor_update_content();
    show_message('Added ' + _via_attribute_being_updated + ' attribute [' + attr_id + '].');
  }
}

function add_new_attribute(attribute_id) {
  _via_attributes[_via_attribute_being_updated][attribute_id] = {};
  _via_attributes[_via_attribute_being_updated][attribute_id].type = 'text';
  _via_attributes[_via_attribute_being_updated][attribute_id].description = '';
  _via_attributes[_via_attribute_being_updated][attribute_id].default_value = '';
}

function update_current_attribute_id(p) {
  _via_current_attribute_id = p.options[p.selectedIndex].value;
  update_attribute_properties_panel();
}

function get_current_attribute_id() {
  return document.getElementById('attributes_name_list').value;
}

function update_attribute_option_id_with_confirm(attr_type, attr_id, option_id, new_option_id) {
  var is_delete = false;
  var config;
  if ( new_option_id === '' || typeof(new_option_id) === 'undefined' ) {
    // an empty new_option_id indicates deletion of option_id
    config = {'title':'Delete an option for ' + attr_type + ' attribute'};
    is_delete = true;
  } else {
    config = {'title':'Rename an option for ' + attr_type + ' attribute'};
  }

  var input = { 'attr_type':{'type':'text', 'name':'Attribute Type', 'value':attr_type, 'disabled':true},
                'attr_id':{'type':'text', 'name':'Attribute Id', 'value':attr_id, 'disabled':true}
              };

  if ( is_delete ) {
    input['option_id'] = {'type':'text', 'name':'Attribute Option', 'value':option_id, 'disabled':true};
  } else {
    input['option_id']     = {'type':'text', 'name':'Attribute Option (old)', 'value':option_id, 'disabled':true},
    input['new_option_id'] = {'type':'text', 'name':'Attribute Option (new)', 'value':new_option_id, 'disabled':true};
  }

  invoke_with_user_inputs(update_attribute_option_id_confirmed, input, config, update_attribute_option_id_cancel);
}

function update_attribute_option_id_cancel(input) {
  update_attribute_properties_panel();
}

function update_attribute_option_id_confirmed(input) {
  var attr_type = input.attr_type.value;
  var attr_id = input.attr_id.value;
  var option_id = input.option_id.value;
  var is_delete;
  var new_option_id;
  if ( typeof(input.new_option_id) === 'undefined' || input.new_option_id === '' ) {
    is_delete = true;
    new_option_id = '';
  } else {
    is_delete = false;
    new_option_id = input.new_option_id.value;
  }

  update_attribute_option(is_delete, attr_type, attr_id, option_id, new_option_id);

  if ( is_delete ) {
    show_message('Deleted option [' + option_id + '] for ' + attr_type + ' attribute [' + attr_id + '].');
  } else {
    show_message('Renamed option [' + option_id + '] to [' + new_option_id + '] for ' + attr_type + ' attribute [' + attr_id + '].');
  }
  update_attribute_properties_panel();
  annotation_editor_update_content();
  user_input_default_cancel_handler();
}

function update_attribute_option(is_delete, attr_type, attr_id, option_id, new_option_id) {
  switch ( attr_type ) {
  case 'region':
    update_region_attribute_option_in_all_metadata(is_delete, attr_id, option_id, new_option_id);
    if ( ! is_delete ) {
      Object.defineProperty(_via_attributes[attr_type][attr_id].options,
                            new_option_id,
                            Object.getOwnPropertyDescriptor(_via_attributes[_via_attribute_being_updated][attr_id].options, option_id));
    }
    delete _via_attributes['region'][attr_id].options[option_id];

    break;
  case 'file':
    update_file_attribute_option_in_all_metadata(attr_id, option_id);
    if ( ! is_delete ) {
      Object.defineProperty(_via_attributes[attr_type][attr_id].options,
                            new_option_id,
                            Object.getOwnPropertyDescriptor(_via_attributes[_via_attribute_being_updated][attr_id].options, option_id));
    }

    delete _via_attributes['file'][attr_id].options[option_id];
    break;
  }
}

function update_file_attribute_option_in_all_metadata(is_delete, attr_id, option_id, new_option_id) {
  var image_id;
  for ( image_id in _via_img_metadata ) {
    if ( _via_img_metadata[image_id].file_attributes.hasOwnProperty(attr_id) ) {
      if ( _via_img_metadata[image_id].file_attributes[attr_id].hasOwnProperty(option_id) ) {
        Object.defineProperty(_via_img_metadata[image_id].file_attributes[attr_id],
                              new_option_id,
                              Object.getOwnPropertyDescriptor(_via_img_metadata[image_id].file_attributes[attr_id], option_id));
        delete _via_img_metadata[image_id].file_attributes[attr_id][option_id];
      }
    }
  }
}

function update_region_attribute_option_in_all_metadata(is_delete, attr_id, option_id, new_option_id) {
  var image_id;
  for ( image_id in _via_img_metadata ) {
    for (var i = 0; i < _via_img_metadata[image_id].regions.length; ++i ) {
      if ( _via_img_metadata[image_id].regions[i].region_attributes.hasOwnProperty(attr_id) ) {
        if ( _via_img_metadata[image_id].regions[i].region_attributes[attr_id].hasOwnProperty(option_id) ) {
          Object.defineProperty(_via_img_metadata[image_id].regions[i].region_attributes[attr_id],
                                new_option_id,
                                Object.getOwnPropertyDescriptor(_via_img_metadata[image_id].regions[i].region_attributes[attr_id], option_id));
          delete _via_img_metadata[image_id].regions[i].region_attributes[attr_id][option_id];
        }
      }
    }
  }
}

function delete_region_attribute_in_all_metadata(attr_id) {
  var image_id;
  for ( image_id in _via_img_metadata ) {
    for (var i = 0; i < _via_img_metadata[image_id].regions.length; ++i ) {
      if ( _via_img_metadata[image_id].regions[i].region_attributes.hasOwnProperty(attr_id)) {
        delete _via_img_metadata[image_id].regions[i].region_attributes[attr_id];
      }
    }
  }
}

function delete_file_attribute_option_from_all_metadata(attr_id, option_id) {
  var image_id;
  for ( image_id in _via_img_metadata ) {
    if ( _via_img_metadata.hasOwnProperty(image_id) ) {
      delete_file_attribute_option_from_metadata(image_id, attr_id, option_id);
    }
  }
}

function delete_file_attribute_option_from_metadata(image_id, attr_id, option_id) {
  var i;
  if ( _via_img_metadata[image_id].file_attributes.hasOwnProperty(attr_id) ) {
    if ( _via_img_metadata[image_id].file_attributes[attr_id].hasOwnProperty(option_id) ) {
      delete _via_img_metadata[image_id].file_attributes[attr_id][option_id];
    }
  }
}

function delete_file_attribute_from_all_metadata(image_id, attr_id) {
  var image_id;
  for ( image_id in _via_img_metadata ) {
    if ( _via_img_metadata.hasOwnProperty(image_id) ) {
      if ( _via_img_metadata[image_id].file_attributes.hasOwnProperty(attr_id) ) {
        delete _via_img_metadata[image_id].file_attributes[attr_id];
      }
    }
  }
}

//
// invoke a method after receiving inputs from user
//
function invoke_with_user_inputs(ok_handler, input, config, cancel_handler) {
  setup_user_input_panel(ok_handler, input, config, cancel_handler);
  show_user_input_panel();
}

function setup_user_input_panel(ok_handler, input, config, cancel_handler) {
  // create html page with OK and CANCEL button
  // when OK is clicked
  //  - setup input with all the user entered values
  //  - invoke handler with input
  // when CANCEL is clicked
  //  - invoke user_input_cancel()
  _via_user_input_ok_handler = ok_handler;
  _via_user_input_cancel_handler = cancel_handler;
  _via_user_input_data = input;

  var p = document.getElementById('user_input_panel');
  var c = document.createElement('div');
  c.setAttribute('class', 'content');
  var html = [];
  html.push('<p class="title">' + config.title + '</p>');

  html.push('<div class="user_inputs">');
  var key;
  for ( key in _via_user_input_data ) {
    html.push('<div class="row">');
    html.push('<span class="cell">' + _via_user_input_data[key].name + '</span>');
    var disabled_html = '';
    if ( _via_user_input_data[key].disabled ) {
      disabled_html = 'disabled="disabled"';
    }
    var value_html = '';
    if ( _via_user_input_data[key].value ) {
      value_html = 'value="' + _via_user_input_data[key].value + '"';
    }

    switch(_via_user_input_data[key].type) {
    case 'checkbox':
      if ( _via_user_input_data[key].checked ) {
        value_html = 'checked="checked"';
      } else {
        value_html = '';
      }
      html.push('<span class="cell">' +
                '<input class="_via_user_input_variable" ' +
                value_html + ' ' +
                disabled_html + ' ' +
                'type="checkbox" id="' + key + '"></span>');
      break;
    case 'text':
      var size = '50';
      if ( _via_user_input_data[key].size ) {
        size = _via_user_input_data[key].size;
      }
      var placeholder = '';
      if ( _via_user_input_data[key].placeholder ) {
        placeholder = _via_user_input_data[key].placeholder;
      }
      html.push('<span class="cell">' +
                '<input class="_via_user_input_variable" ' +
                value_html + ' ' +
                disabled_html + ' ' +
                'size="' + size + '" ' +
                'placeholder="' + placeholder + '" ' +
                'type="text" id="' + key + '"></span>');

      break;
    case 'textarea':
      var rows = '5';
      var cols = '50'
      if ( _via_user_input_data[key].rows ) {
        rows = _via_user_input_data[key].rows;
      }
      if ( _via_user_input_data[key].cols ) {
        cols = _via_user_input_data[key].cols;
      }
      var placeholder = '';
      if ( _via_user_input_data[key].placeholder ) {
        placeholder = _via_user_input_data[key].placeholder;
      }
      html.push('<span class="cell">' +
                '<textarea class="_via_user_input_variable" ' +
                disabled_html + ' ' +
                'rows="' + rows + '" ' +
                'cols="' + cols + '" ' +
                'placeholder="' + placeholder + '" ' +
                'id="' + key + '">' + value_html + '</textarea></span>');

      break;

    }
    html.push('</div>'); // end of row
  }
  html.push('</div>'); // end of user_input div
  // optional warning before confirmation
  if (config.hasOwnProperty("warning") ) {
    html.push('<div class="warning">' + config.warning + '</div>');
  }
  html.push('<div class="user_confirm">' +
            '<span class="ok">' +
            '<button id="user_input_ok_button" onclick="user_input_parse_and_invoke_handler()">&nbsp;OK&nbsp;</button></span>' +
            '<span class="cancel">' +
            '<button id="user_input_cancel_button" onclick="user_input_cancel_handler()">CANCEL</button></span></div>');
  c.innerHTML = html.join('');
  p.innerHTML = '';
  p.appendChild(c);

}

function user_input_default_cancel_handler() {
  hide_user_input_panel();
  _via_user_input_data = {};
  _via_user_input_ok_handler = null;
  _via_user_input_cancel_handler = null;
}

function user_input_cancel_handler() {
  if ( _via_user_input_cancel_handler ) {
    _via_user_input_cancel_handler();
  }
  user_input_default_cancel_handler();
}

function user_input_parse_and_invoke_handler() {
  var elist = document.getElementsByClassName('_via_user_input_variable');
  var i;
  for ( i=0; i < elist.length; ++i ) {
    var eid = elist[i].id;
    if ( _via_user_input_data.hasOwnProperty(eid) ) {
      switch(_via_user_input_data[eid].type) {
      case 'checkbox':
        _via_user_input_data[eid].value = elist[i].checked;
        break;
      default:
        _via_user_input_data[eid].value = elist[i].value;
        break;
      }
    }
  }
  if ( typeof(_via_user_input_data.confirm) !== 'undefined' ) {
    if ( _via_user_input_data.confirm.value ) {
      _via_user_input_ok_handler(_via_user_input_data);
    } else {
      if ( _via_user_input_cancel_handler ) {
        _via_user_input_cancel_handler();
      }
    }
  } else {
    _via_user_input_ok_handler(_via_user_input_data);
  }
  user_input_default_cancel_handler();
}

function show_user_input_panel() {
  document.getElementById('user_input_panel').style.display = 'block';
}

function hide_user_input_panel() {
  document.getElementById('user_input_panel').style.display = 'none';
}

//
// annotations editor panel
//
function annotation_editor_show() {
  // remove existing annotation editor (if any)
  annotation_editor_remove();

  // create new container of annotation editor
  var ae = document.createElement('div');
  ae.setAttribute('id', 'annotation_editor');

  if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION ) {
    if ( _via_settings.ui.image.on_image_annotation_editor_placement === VIA_ANNOTATION_EDITOR_PLACEMENT.DISABLE ) {
      return;
    }

    // only display on-image annotation editor if
    // - region attribute are defined
    // - region is selected
    if ( _via_is_region_selected &&
         Object.keys(_via_attributes['region']).length &&
         _via_attributes['region'].constructor === Object ) {
      ae.classList.add('force_small_font');
      ae.classList.add('display_area_content'); // to enable automatic hiding of this content
      // add annotation editor to image_panel
      if ( _via_settings.ui.image.on_image_annotation_editor_placement === VIA_ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION ) {
        var html_position = annotation_editor_get_placement(_via_user_sel_region_id);
        ae.style.top = html_position.top;
        ae.style.left = html_position.left;
      }
      _via_display_area.appendChild(ae);
      annotation_editor_update_content();
      update_vertical_space();
    }
  } else {
    // show annotation editor in a separate panel at the bottom
    _via_annotaion_editor_panel.appendChild(ae);
    annotation_editor_update_content();
    update_vertical_space();

    if ( _via_is_region_selected ) {
      // highlight entry for region_id in annotation editor panel
      annotation_editor_scroll_to_row(_via_user_sel_region_id);
      annotation_editor_highlight_row(_via_user_sel_region_id);
    }
  }
}

function annotation_editor_hide() {
  if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION ) {
    // remove existing annotation editor (if any)
    annotation_editor_remove();
  } else {
    annotation_editor_clear_row_highlight();
  }
}

function annotation_editor_toggle_on_image_editor() {
  if ( _via_settings.ui.image.on_image_annotation_editor_placement === VIA_ANNOTATION_EDITOR_PLACEMENT.DISABLE ) {
    _via_annotation_editor_mode = VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION;
    _via_settings.ui.image.on_image_annotation_editor_placement = VIA_ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION;
    annotation_editor_show();
    show_message('Enabled on image annotation editor');
  } else {
    _via_settings.ui.image.on_image_annotation_editor_placement = VIA_ANNOTATION_EDITOR_PLACEMENT.DISABLE;
    _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS;
    annotation_editor_hide();
    show_message('Disabled on image annotation editor');
  }
}

function annotation_editor_update_content() {
  return new Promise( function(ok_callback, err_callback) {
    var ae = document.getElementById('annotation_editor');
    if (ae ) {
      ae.innerHTML = '';
      annotation_editor_update_header_html();
      annotation_editor_update_metadata_html();
    }
    ok_callback();
  });
}

function annotation_editor_get_placement(region_id) {
  var html_position = {};
  var r = _via_canvas_regions[region_id]['shape_attributes'];
  var shape = r['name'];
  switch( shape ) {
  case 'rect':
    html_position.top = r['y'] + r['height'];
    html_position.left = r['x'] + r['width'];
    break;
  case 'circle':
    html_position.top = r['cy'] + r['r'];
    html_position.left = r['cx'];
    break;
  case 'ellipse':
    html_position.top = r['cy'] + r['ry'] * Math.cos(r['theta']);
    html_position.left = r['cx'] - r['ry'] * Math.sin(r['theta']);
    break;
  case 'polygon':
  case 'polyline':
    var most_left =
      Object.keys(r['all_points_x']).reduce(function(a, b){
        return r['all_points_x'][a] > r['all_points_x'][b] ? a : b });
    html_position.top  = Math.max( r['all_points_y'][most_left] );
    html_position.left = Math.max( r['all_points_x'][most_left] );
    break;
  case 'point':
    html_position.top = r['cy'];
    html_position.left = r['cx'];
    break;
  }
  html_position.top  = html_position.top + _via_img_panel.offsetTop + VIA_REGION_EDGE_TOL + 'px';
  html_position.left = html_position.left + _via_img_panel.offsetLeft + VIA_REGION_EDGE_TOL + 'px';
  return html_position;
}

function annotation_editor_remove() {
  var p = document.getElementById('annotation_editor');
  if ( p ) {
    p.remove();
  }
}

function is_annotation_editor_visible() {
  return document.getElementById('annotation_editor_panel').classList.contains('display_block');
}

function annotation_editor_toggle_all_regions_editor() {
  var p = document.getElementById('annotation_editor_panel');
  if ( p.classList.contains('display_block') ) {
    p.classList.remove('display_block');
    _via_annotation_editor_mode = VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION;
  } else {
    _via_annotation_editor_mode = VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS;
    p.classList.add('display_block');
    p.style.height = _via_settings.ui.annotation_editor_height + '%';
    p.style.fontSize = _via_settings.ui.annotation_editor_fontsize + 'rem';
    annotation_editor_show();
  }
}

function annotation_editor_set_active_button() {
  var attribute_type;
  for ( attribute_type in _via_attributes ) {
    var bid = 'button_edit_' + attribute_type + '_metadata';
    document.getElementById(bid).classList.remove('active');
  }
  var bid = 'button_edit_' + _via_metadata_being_updated + '_metadata';
  document.getElementById(bid).classList.add('active');
}

function edit_region_metadata_in_annotation_editor() {
  _via_metadata_being_updated = 'region';
  annotation_editor_set_active_button();
  annotation_editor_update_content();
}
function edit_file_metadata_in_annotation_editor() {
  _via_metadata_being_updated = 'file';
  annotation_editor_set_active_button();
  annotation_editor_update_content();
}

function annotation_editor_update_header_html() {
  var head = document.createElement('div');
  head.setAttribute('class', 'row');
  head.setAttribute('id', 'annotation_editor_header');

  if ( _via_metadata_being_updated === 'region' ) {
    var rid_col = document.createElement('span');
    rid_col.setAttribute('class', 'col');
    rid_col.innerHTML = '';
    head.appendChild(rid_col);
  }

  if ( _via_metadata_being_updated === 'file' ) {
    var rid_col = document.createElement('span');
    rid_col.setAttribute('class', 'col header');
    if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
      rid_col.innerHTML = 'group';
    } else {
      rid_col.innerHTML = 'filename';
    }
    head.appendChild(rid_col);
  }

  var attr_id;
  for ( attr_id in _via_attributes[_via_metadata_being_updated] ) {
    var col = document.createElement('span');
    col.setAttribute('class', 'col header');
    col.innerHTML = attr_id;
    head.appendChild(col);
  }

  var ae = document.getElementById('annotation_editor');
  if ( ae.childNodes.length === 0 ) {
    ae.appendChild(head);
  } else {
    if ( ae.firstChild.id === 'annotation_editor_header') {
      ae.replaceChild(head, ae.firstChild);
    } else {
      // header node is absent
      ae.insertBefore(head, ae.firstChild);
    }
  }
}

function annotation_editor_update_metadata_html() {
  if ( ! _via_img_count ) {
    return;
  }

  var ae = document.getElementById('annotation_editor');
  switch ( _via_metadata_being_updated ) {
  case 'region':
    var rindex;
    if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
      ae.appendChild( annotation_editor_get_metadata_row_html(0) );
    } else {
      if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE ) {
        if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION ) {
          ae.appendChild( annotation_editor_get_metadata_row_html(_via_user_sel_region_id) );
        } else {
          for ( rindex = 0; rindex < _via_img_metadata[_via_image_id].regions.length; ++rindex ) {
            ae.appendChild( annotation_editor_get_metadata_row_html(rindex) );
          }
        }
      }
    }
    break;

  case 'file':
    ae.appendChild( annotation_editor_get_metadata_row_html(0) );
    break;
  }
}

function annotation_editor_update_row(row_id) {
  var ae = document.getElementById('annotation_editor');

  var new_row = annotation_editor_get_metadata_row_html(row_id);
  var old_row = document.getElementById(new_row.getAttribute('id'));
  ae.replaceChild(new_row, old_row);
}

function annotation_editor_add_row(row_id) {
  if ( is_annotation_editor_visible() ) {
    var ae = document.getElementById('annotation_editor');
    var new_row = annotation_editor_get_metadata_row_html(row_id);
    var penultimate_row_id = parseInt(row_id) - 1;
    if ( penultimate_row_id >= 0 ) {
      var penultimate_row_html_id = 'ae_' + _via_metadata_being_updated + '_' + penultimate_row_id;
      var penultimate_row = document.getElementById(penultimate_row_html_id);
      ae.insertBefore(new_row, penultimate_row.nextSibling);
    } else {
      ae.appendChild(new_row);
    }
  }
}

function annotation_editor_get_metadata_row_html(row_id) {
  var row = document.createElement('div');
  row.setAttribute('class', 'row');
  row.setAttribute('id', 'ae_' + _via_metadata_being_updated + '_' + row_id);

  if ( _via_metadata_being_updated === 'region' ) {
    var rid = document.createElement('span');

    switch(_via_display_area_content_name) {
    case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
      rid.setAttribute('class', 'col');
      rid.innerHTML = 'Grouped regions in ' + _via_image_grid_selected_img_index_list.length + ' files';
      break;
    case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE:
      rid.setAttribute('class', 'col id');
      rid.innerHTML = (row_id + 1);
      break;
    }
    row.appendChild(rid);
  }

  if ( _via_metadata_being_updated === 'file' ) {
    var rid = document.createElement('span');
    rid.setAttribute('class', 'col');
    switch(_via_display_area_content_name) {
    case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID:
      rid.innerHTML = 'Group of ' + _via_image_grid_selected_img_index_list.length + ' files';
      break;
    case VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE:
      rid.innerHTML = _via_image_filename_list[_via_image_index];
      break;
    }

    row.appendChild(rid);
  }

  var attr_id;
  for ( attr_id in _via_attributes[_via_metadata_being_updated] ) {
    var col = document.createElement('span');
    col.setAttribute('class', 'col');

    var attr_type    = _via_attributes[_via_metadata_being_updated][attr_id].type;
    var attr_desc    = _via_attributes[_via_metadata_being_updated][attr_id].desc;
    if ( typeof(attr_desc) === 'undefined' ) {
      attr_desc = '';
    }
    var attr_html_id = attr_id + '__' + row_id;

    var attr_value = '';
    var attr_placeholder = '';
    if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE ) {
      switch(_via_metadata_being_updated) {
      case 'region':
        if ( _via_img_metadata[_via_image_id].regions[row_id].region_attributes.hasOwnProperty(attr_id) ) {
          attr_value = _via_img_metadata[_via_image_id].regions[row_id].region_attributes[attr_id];
        } else {
          attr_placeholder = 'not defined yet!';
        }
      case 'file':
        if ( _via_img_metadata[_via_image_id].file_attributes.hasOwnProperty(attr_id) ) {
          attr_value = _via_img_metadata[_via_image_id].file_attributes[attr_id];
        } else {
          attr_placeholder = 'not defined yet!';
        }
      }
    }

    if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
      var attr_metadata_stat;
      switch(_via_metadata_being_updated) {
      case 'region':
        attr_metadata_stat = _via_get_region_metadata_stat(_via_image_grid_selected_img_index_list, attr_id);
        break;
      case 'file':
        attr_metadata_stat = _via_get_file_metadata_stat(_via_image_grid_selected_img_index_list, attr_id);
        break;
      }

      switch ( attr_type ) {
      case 'text':
        if ( attr_metadata_stat.hasOwnProperty(attr_id) ) {
          var attr_value_set = Object.keys(attr_metadata_stat[attr_id]);
          if ( attr_value_set.includes('undefined') ) {
            attr_value = '';
            attr_placeholder = 'includes ' + attr_metadata_stat[attr_id]['undefined'] + ' undefined values';
          } else {
            switch( attr_value_set.length ) {
            case 0:
              attr_value = '';
              attr_placeholder = 'not applicable';
              break;
            case 1:
              attr_value = attr_value_set[0];
              attr_placeholder = '';
              break;
            default:
              attr_value = '';
              attr_placeholder = attr_value_set.length + ' different values: ' + JSON.stringify(attr_value_set).replace(/"/g,'\'');
            }
          }
        } else {
          attr_value = '';
          attr_placeholder = 'not defined yet!';
        }
        break;

      case 'radio':    // fallback
      case 'dropdown': // fallback
      case 'image':    // fallback
        if ( attr_metadata_stat.hasOwnProperty(attr_id) ) {
          var attr_value_set = Object.keys(attr_metadata_stat[attr_id]);
          if ( attr_value_set.length === 1 ) {
            attr_value = attr_value_set[0];
          } else {
            attr_value = '';
          }
        } else {
          attr_value = '';
        }
        break;

      case 'checkbox':
        attr_value = {};
        if ( attr_metadata_stat.hasOwnProperty(attr_id) ) {
          var attr_value_set = Object.keys(attr_metadata_stat[attr_id]);
          var same_count = true;
          var i, n;
          var attr_value_curr, attr_value_next;
          n = attr_value_set.length;
          for ( i = 0; i < n - 1; ++i ) {
            attr_value_curr = attr_value_set[i];
            attr_value_next = attr_value_set[i+1];

            if ( attr_metadata_stat[attr_id][attr_value_curr] !== attr_metadata_stat[attr_id][attr_value_next] ) {
              same_count = false;
              break;
            }
          }
          if ( same_count ) {
            var attr_value_i;
            for ( attr_value_i in attr_metadata_stat[attr_id] ) {
              attr_value[attr_value_i] = true;
            }
          }
        }
        break;
      }
    }

    switch(attr_type) {
    case 'text':
      col.innerHTML = '<textarea ' +
        'onchange="annotation_editor_on_metadata_update(this)" ' +
        'onfocus="annotation_editor_on_metadata_focus(this)" ' +
        'title="' + attr_desc + '" ' +
        'placeholder="' + attr_placeholder + '" ' +
        'id="' + attr_html_id + '">' + attr_value + '</textarea>';
      break;
    case 'checkbox':
      var options = _via_attributes[_via_metadata_being_updated][attr_id].options;
      var option_id;
      for ( option_id in options ) {
        var option_html_id = attr_html_id + '__' + option_id;
        var option = document.createElement('input');
        option.setAttribute('type', 'checkbox');
        option.setAttribute('value', option_id);
        option.setAttribute('id', option_html_id);
        option.setAttribute('onfocus', 'annotation_editor_on_metadata_focus(this)');
        option.setAttribute('onchange', 'annotation_editor_on_metadata_update(this)');

        var option_desc  = _via_attributes[_via_metadata_being_updated][attr_id].options[option_id];
        if ( option_desc === '' || typeof(option_desc) === 'undefined' ) {
          // option description is optional, use option_id when description is not present
          option_desc = option_id;
        }

        // set the value of options based on the user annotations
        if ( typeof attr_value !== 'undefined') {
          if ( attr_value.hasOwnProperty(option_id) ) {
            option.checked = attr_value[option_id];
          }
        }

        var label  = document.createElement('label');
        label.setAttribute('for', option_html_id);
        label.innerHTML = option_desc;

        var container = document.createElement('span');
        container.appendChild(option);
        container.appendChild(label);
        col.appendChild(container);
      }
      break;
    case 'radio':
      var option_id;
      for ( option_id in _via_attributes[_via_metadata_being_updated][attr_id].options ) {
        var option_html_id = attr_html_id + '__' + option_id;
        var option = document.createElement('input');
        option.setAttribute('type', 'radio');
        option.setAttribute('name', attr_html_id);
        option.setAttribute('value', option_id);
        option.setAttribute('id', option_html_id);
        option.setAttribute('onfocus', 'annotation_editor_on_metadata_focus(this)');
        option.setAttribute('onchange', 'annotation_editor_on_metadata_update(this)');

        var option_desc  = _via_attributes[_via_metadata_being_updated][attr_id].options[option_id];
        if ( option_desc === '' || typeof(option_desc) === 'undefined' ) {
          // option description is optional, use option_id when description is not present
          option_desc = option_id;
        }

        if ( attr_value === option_id ) {
          option.checked = true;
        }

        var label  = document.createElement('label');
        label.setAttribute('for', option_html_id);
        label.innerHTML = option_desc;

        var container = document.createElement('span');
        container.appendChild(option);
        container.appendChild(label);
        col.appendChild(container);
      }
      break;
    case 'image':
      var option_id;
      var option_count = 0;
      for ( option_id in _via_attributes[_via_metadata_being_updated][attr_id].options ) {
        option_count = option_count + 1;
      }
      var img_options = document.createElement('div');
      img_options.setAttribute('class', 'img_options');
      col.appendChild(img_options);

      var option_index = 0;
      for ( option_id in _via_attributes[_via_metadata_being_updated][attr_id].options ) {
        var option_html_id = attr_html_id + '__' + option_id;
        var option = document.createElement('input');
        option.setAttribute('type', 'radio');
        option.setAttribute('name', attr_html_id);
        option.setAttribute('value', option_id);
        option.setAttribute('id', option_html_id);
        option.setAttribute('onfocus', 'annotation_editor_on_metadata_focus(this)');
        option.setAttribute('onchange', 'annotation_editor_on_metadata_update(this)');

        var option_desc  = _via_attributes[_via_metadata_being_updated][attr_id].options[option_id];
        if ( option_desc === '' || typeof(option_desc) === 'undefined' ) {
          // option description is optional, use option_id when description is not present
          option_desc = option_id;
        }

        if ( attr_value === option_id ) {
          option.checked = true;
        }

        var label  = document.createElement('label');
        label.setAttribute('for', option_html_id);
        label.innerHTML = '<img src="' + option_desc + '"><p>' + option_id + '</p>';

        var container = document.createElement('span');
        container.appendChild(option);
        container.appendChild(label);
        img_options.appendChild(container);
      }
      break;

    case 'dropdown':
      var sel = document.createElement('select');
      sel.setAttribute('id', attr_html_id);
      sel.setAttribute('onfocus', 'annotation_editor_on_metadata_focus(this)');
      sel.setAttribute('onchange', 'annotation_editor_on_metadata_update(this)');
      var option_id;
      var option_selected = false;
      for ( option_id in _via_attributes[_via_metadata_being_updated][attr_id].options ) {
        var option_html_id = attr_html_id + '__' + option_id;
        var option = document.createElement('option');
        option.setAttribute('value', option_id);

        var option_desc  = _via_attributes[_via_metadata_being_updated][attr_id].options[option_id];
        if ( option_desc === '' || typeof(option_desc) === 'undefined' ) {
          // option description is optional, use option_id when description is not present
          option_desc = option_id;
        }

        if ( option_id === attr_value ) {
          option.setAttribute('selected', 'selected');
          option_selected = true;
        }
        option.innerHTML = option_desc;
        sel.appendChild(option);
      }

      if ( ! option_selected ) {
        sel.selectedIndex = '-1';
      }
      col.appendChild(sel);
      break;
    }

    row.appendChild(col);
  }
  return row;
}

function annotation_editor_scroll_to_row(row_id) {
  if ( is_annotation_editor_visible() ) {
    var row_html_id = 'ae_' + _via_metadata_being_updated + '_' + row_id;
    var row = document.getElementById(row_html_id);
    row.scrollIntoView(false);
  }
}

function annotation_editor_highlight_row(row_id) {
  if ( is_annotation_editor_visible() ) {
    var row_html_id = 'ae_' + _via_metadata_being_updated + '_' + row_id;
    var row = document.getElementById(row_html_id);
    row.classList.add('highlight');
  }
}

function annotation_editor_clear_row_highlight() {
  if ( is_annotation_editor_visible() ) {
    var ae = document.getElementById('annotation_editor');
    var i;
    for ( i=0; i<ae.childNodes.length; ++i ) {
      ae.childNodes[i].classList.remove('highlight');
    }
  }
}

function annotation_editor_extract_html_id_components(html_id) {
  // html_id : attribute_name__row-id__option_id
  var parts = html_id.split('__');
  var parsed_id = {};
  switch( parts.length ) {
  case 3:
    // html_id : attribute-id__row-id__option_id
    parsed_id.attr_id = parts[0];
    parsed_id.row_id  = parts[1];
    parsed_id.option_id = parts[2];
    break;
  case 2:
    // html_id : attribute-id__row-id
    parsed_id.attr_id = parts[0];
    parsed_id.row_id  = parts[1];
    break;
  default:
  }
  return parsed_id;
}

function _via_get_file_metadata_stat(img_index_list, attr_id) {
  var stat = {};
  stat[attr_id] = {};
  var i, n, img_id, img_index, value;
  n = img_index_list.length;
  for ( i = 0; i < n; ++i ) {
    img_index = img_index_list[i];
    img_id = _via_image_id_list[img_index];
    if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty(attr_id) ) {
      value = _via_img_metadata[img_id].file_attributes[attr_id];
      if ( typeof(value) === 'object' ) {
        // checkbox has multiple values and hence is object
        var key;
        for ( key in value ) {
          if ( stat[attr_id].hasOwnProperty(key) ) {
            stat[attr_id][key] += 1;
          } else {
            stat[attr_id][key] = 1;
          }
        }
      } else {
        if ( stat[attr_id].hasOwnProperty(value) ) {
          stat[attr_id][value] += 1;
        } else {
          stat[attr_id][value] = 1;
        }
      }
    }

  }
  return stat;
}

function _via_get_region_metadata_stat(img_index_list, attr_id) {
  var stat = {};
  stat[attr_id] = {};
  var i, n, img_id, img_index, value;
  var j, m;
  n = img_index_list.length;
  for ( i = 0; i < n; ++i ) {
    img_index = img_index_list[i];
    img_id = _via_image_id_list[img_index];
    m = _via_img_metadata[img_id].regions.length;
    for ( j = 0; j < m; ++j ) {
      if ( ! image_grid_is_region_in_current_group( _via_img_metadata[img_id].regions[j].region_attributes ) ) {
        // skip region not in current group
        continue;
      }

      value = _via_img_metadata[img_id].regions[j].region_attributes[attr_id];
      if ( typeof(value) === 'object' ) {
        // checkbox has multiple values and hence is object
        var key;
        for ( key in value ) {
          if ( stat[attr_id].hasOwnProperty(key) ) {
            stat[attr_id][key] += 1;
          } else {
            stat[attr_id][key] = 1;
          }
        }
      } else {
        if ( stat[attr_id].hasOwnProperty(value) ) {
          stat[attr_id][value] += 1;
        } else {
          stat[attr_id][value] = 1;
        }
      }
    }
  }
  return stat;
}

// invoked when the input entry in annotation editor receives focus
function annotation_editor_on_metadata_focus(p) {
  if ( _via_annotation_editor_mode === VIA_ANNOTATION_EDITOR_MODE.ALL_REGIONS ) {
    var pid       = annotation_editor_extract_html_id_components(p.id);
    var region_id = pid.row_id;
    // clear existing highlights (if any)
    toggle_all_regions_selection(false);
    annotation_editor_clear_row_highlight();
    // set new selection highlights
    set_region_select_state(region_id, true);
    annotation_editor_scroll_to_row(region_id);
    annotation_editor_highlight_row(region_id);

    _via_redraw_reg_canvas();
  }
}

// invoked when the user updates annotations using the annotation editor
function annotation_editor_on_metadata_update(p) {
  var pid       = annotation_editor_extract_html_id_components(p.id);
  var img_id    = _via_image_id;

  var img_index_list = [ _via_image_index ];
  var region_id = pid.row_id;
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    img_index_list = _via_image_grid_selected_img_index_list.slice(0);
    region_id = -1; // this flag denotes that we want to update all regions
  }

  if ( _via_metadata_being_updated === 'file' ) {
    annotation_editor_update_file_metadata(img_index_list, pid.attr_id, p.value, p.checked).then( function(update_count) {
      annotation_editor_on_metadata_update_done('file', pid.attr_id, update_count);
    }, function(err) {
      console.log(err)
      show_message('Failed to update file attributes! ' + err);
    });
    return;
  }

  if ( _via_metadata_being_updated === 'region' ) {
    annotation_editor_update_region_metadata(img_index_list, region_id, pid.attr_id, p.value, p.checked).then( function(update_count) {
      annotation_editor_on_metadata_update_done('region', pid.attr_id, update_count);
    }, function(err) {
      show_message('Failed to update region attributes! ');
    });
    return;
  }
}

function annotation_editor_on_metadata_update_done(type, attr_id, update_count) {
  show_message('Updated ' + type + ' attributes of ' + update_count + ' ' + type + 's');
  // check if the updated attribute is one of the group variables
  var i, n, type, attr_id;
  n = _via_image_grid_group_var.length;
  var clear_all_group = false;
  for ( i = 0; i < n; ++i ) {
    if ( _via_image_grid_group_var[i].type === type &&
         _via_image_grid_group_var[i].name === attr_id ) {
      clear_all_group = true;
      break;
    }
  }
  _via_regions_group_color_init();
  _via_redraw_reg_canvas();

  // @todo: it is wasteful to cancel the full set of groups.
  // we should only cancel the groups that are affected by this update.
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    if ( clear_all_group ) {
      image_grid_show_all_project_images();
    }
  }
}

function annotation_editor_update_file_metadata(img_index_list, attr_id, new_value, new_checked) {
  return new Promise( function(ok_callback, err_callback) {
    var i, n, img_id, img_index;
    n = img_index_list.length;
    var update_count = 0;
    for ( i = 0; i < n; ++i ) {
      img_index = img_index_list[i];
      img_id = _via_image_id_list[img_index];

      switch( _via_attributes['file'][attr_id].type ) {
      case 'text':  // fallback
      case 'radio': // fallback
      case 'dropdown': // fallback
      case 'image':
        _via_img_metadata[img_id].file_attributes[attr_id] = new_value;
        update_count += 1;
        break;

      case 'checkbox':
        var option_id = new_value;
        if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty(attr_id) ) {
          if ( typeof(_via_img_metadata[img_id].file_attributes[attr_id]) !== 'object' ) {
            var old_value = _via_img_metadata[img_id].file_attributes[attr_id];
            _via_img_metadata[img_id].file_attributes[attr_id] = {};
            if ( Object.keys(_via_attributes['file'][attr_id]['options']).includes(old_value) ) {
              // transform existing value as checkbox option
              _via_img_metadata[img_id].file_attributes[attr_id] = {};
              _via_img_metadata[img_id].file_attributes[attr_id][old_value] = true;
            }
          }
        } else {
          _via_img_metadata[img_id].file_attributes[attr_id] = {};
        }
        if ( new_checked ) {
          _via_img_metadata[img_id].file_attributes[attr_id][option_id] = true;
        } else {
          // false option values are not stored
          delete _via_img_metadata[img_id].file_attributes[attr_id][option_id];
        }
        update_count += 1;
        break;
      }
    }
    ok_callback(update_count);
  });
}

function annotation_editor_update_region_metadata(img_index_list, region_id, attr_id, new_value, new_checked) {
  return new Promise( function(ok_callback, err_callback) {
    var i, n, img_id, img_index;
    n = img_index_list.length;
    var update_count = 0;
    var region_list = [];
    var j, m;

    if ( region_id === -1 ) {
      // update all regions on a file (for image grid view)
      for ( i = 0; i < n; ++i ) {
        img_index = img_index_list[i];
        img_id = _via_image_id_list[img_index];

        m = _via_img_metadata[img_id].regions.length;
        for ( j = 0; j < m; ++j ) {
          if ( ! image_grid_is_region_in_current_group( _via_img_metadata[img_id].regions[j].region_attributes ) ) {
            continue;
          }

          switch( _via_attributes['region'][attr_id].type ) {
          case 'text':  // fallback
          case 'dropdown': // fallback
          case 'radio': // fallback
          case 'image':
            _via_img_metadata[img_id].regions[j].region_attributes[attr_id] = new_value;
            update_count += 1;
            break;
          case 'checkbox':
            var option_id = new_value;
            if ( _via_img_metadata[img_id].regions[j].region_attributes.hasOwnProperty(attr_id) ) {
              if ( typeof(_via_img_metadata[img_id].regions[j].region_attributes[attr_id]) !== 'object' ) {
                var old_value = _via_img_metadata[img_id].regions[j].region_attributes[attr_id];
                _via_img_metadata[img_id].regions[j].region_attributes[attr_id] = {}
                if ( Object.keys(_via_attributes['region'][attr_id]['options']).includes(old_value) ) {
                  // transform existing value as checkbox option
                  _via_img_metadata[img_id].regions[j].region_attributes[attr_id][old_value] = true;
                }
              }
            } else {
              _via_img_metadata[img_id].regions[j].region_attributes[attr_id] = {};
            }

            if ( new_checked ) {
              _via_img_metadata[img_id].regions[j].region_attributes[attr_id][option_id] = true;
            } else {
              // false option values are not stored
              delete _via_img_metadata[img_id].regions[j].region_attributes[attr_id][option_id];
            }
            update_count += 1;
            break;
          }
        }
      }
    } else {
      // update a single region in a file (for single image view)
      // update all regions on a file (for image grid view)
      for ( i = 0; i < n; ++i ) {
        img_index = img_index_list[i];
        img_id = _via_image_id_list[img_index];

        switch( _via_attributes['region'][attr_id].type ) {
        case 'text':  // fallback
        case 'dropdown': // fallback
        case 'radio': // fallback
        case 'image':
          _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id] = new_value;
          update_count += 1;
          break;
        case 'checkbox':
          var option_id = new_value;

          if ( _via_img_metadata[img_id].regions[region_id].region_attributes.hasOwnProperty(attr_id) ) {
            if ( typeof(_via_img_metadata[img_id].regions[region_id].region_attributes[attr_id]) !== 'object' ) {
              var old_value = _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id];
              _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id] = {};
              if ( Object.keys(_via_attributes['region'][attr_id]['options']).includes(old_value) ) {
                // transform existing value as checkbox option
                _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id][old_value] = true;
              }
            }
          } else {
            _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id] = {};
          }

          if ( new_checked ) {
            _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id][option_id] = true;
          } else {
            // false option values are not stored
            delete _via_img_metadata[img_id].regions[region_id].region_attributes[attr_id][option_id];
          }
          update_count += 1;
          break;
        }
      }
    }
    ok_callback(update_count);
  });
}

function set_region_annotations_to_default_value(rid) {
  var attr_id;
  for ( attr_id in _via_attributes['region'] ) {
    var attr_type = _via_attributes['region'][attr_id].type;
    switch( attr_type ) {
    case 'text':
      var default_value = _via_attributes['region'][attr_id].default_value;
      if ( typeof(default_value) !== 'undefined' ) {
        _via_img_metadata[_via_image_id].regions[rid].region_attributes[attr_id] = default_value;
      }
      break;
    case 'image':    // fallback
    case 'dropdown': // fallback
    case 'radio':
      _via_img_metadata[_via_image_id].regions[rid].region_attributes[attr_id] = '';
      var default_options = _via_attributes['region'][attr_id].default_options;
      if ( typeof(default_options) !== 'undefined' ) {
        _via_img_metadata[_via_image_id].regions[rid].region_attributes[attr_id] = Object.keys(default_options)[0];
      }
      break;

    case 'checkbox':
      _via_img_metadata[_via_image_id].regions[rid].region_attributes[attr_id] = {};
      var default_options = _via_attributes['region'][attr_id].default_options;
      if ( typeof(default_options) !== 'underfined' ) {
        var option_id;
        for ( option_id in default_options ) {
          var default_value = default_options[option_id];
          if ( typeof(default_value) !== 'underfined' ) {
            _via_img_metadata[_via_image_id].regions[rid].region_attributes[attr_id][option_id] = default_value;
          }
        }
      }
      break;
    }
  }
}

function set_file_annotations_to_default_value(image_id) {
  var attr_id;
  for ( attr_id in _via_attributes['file'] ) {
    var attr_type = _via_attributes['file'][attr_id].type;
    switch( attr_type ) {
    case 'text':
      var default_value = _via_attributes['file'][attr_id].default_value;
      _via_img_metadata[image_id].file_attributes[attr_id] = default_value;
      break;
    case 'image':    // fallback
    case 'dropdown': // fallback
    case 'radio':
      _via_img_metadata[image_id].file_attributes[attr_id] = '';
      var default_options = _via_attributes['file'][attr_id].default_options;
      _via_img_metadata[image_id].file_attributes[attr_id] = Object.keys(default_options)[0];
      break;
    case 'checkbox':
      _via_img_metadata[image_id].file_attributes[attr_id] = {};
      var default_options = _via_attributes['file'][attr_id].default_options;
      var option_id;
      for ( option_id in default_options ) {
        var default_value = default_options[option_id];
        _via_img_metadata[image_id].file_attributes[attr_id][option_id] = default_value;
      }
      break;
    }
  }
}

function annotation_editor_increase_panel_height() {
  var p = document.getElementById('annotation_editor_panel');
  if ( _via_settings.ui.annotation_editor_height < 95 ) {
    _via_settings.ui.annotation_editor_height += VIA_ANNOTATION_EDITOR_HEIGHT_CHANGE;
    p.style.height = _via_settings.ui.annotation_editor_height + '%';
  }
}

function annotation_editor_decrease_panel_height() {
  var p = document.getElementById('annotation_editor_panel');
  if ( _via_settings.ui.annotation_editor_height > 10 ) {
    _via_settings.ui.annotation_editor_height -= VIA_ANNOTATION_EDITOR_HEIGHT_CHANGE;
    p.style.height = _via_settings.ui.annotation_editor_height + '%';
  }
}

function annotation_editor_increase_content_size() {
  var p = document.getElementById('annotation_editor_panel');
  if ( _via_settings.ui.annotation_editor_fontsize < 1.6 ) {
    _via_settings.ui.annotation_editor_fontsize += VIA_ANNOTATION_EDITOR_FONTSIZE_CHANGE;
    p.style.fontSize = _via_settings.ui.annotation_editor_fontsize + 'rem';
  }
}

function annotation_editor_decrease_content_size() {
  var p = document.getElementById('annotation_editor_panel');
  if ( _via_settings.ui.annotation_editor_fontsize > 0.4 ) {
    _via_settings.ui.annotation_editor_fontsize -= VIA_ANNOTATION_EDITOR_FONTSIZE_CHANGE;
    p.style.fontSize = _via_settings.ui.annotation_editor_fontsize + 'rem';
  }
}

//
// via project
//
function project_set_name(name) {
  _via_settings.project.name = name;

  var p = document.getElementById('project_name');
  p.value = _via_settings.project.name;
}

function project_init_default_project() {
  if ( ! _via_settings.hasOwnProperty('project') ) {
    _via_settings.project = {};
  }

  project_set_name( project_get_default_project_name() );
}

function project_on_name_update(p) {
  project_set_name(p.value);
}

function project_get_default_project_name() {
  const now = new Date();
  var MONTH_SHORT_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var ts = now.getDate() + MONTH_SHORT_NAME[now.getMonth()] + now.getFullYear() +
      '_' + now.getHours() + 'h' + now.getMinutes() + 'm';

  var project_name = 'via_project_' + ts;
  return project_name;
}

function project_save_with_confirm() {
  var config = {'title':'Save Project' };
  var input = { 'project_name': { type:'text', name:'Project Name', value:_via_settings.project.name, disabled:false, size:30 },
                'save_annotations':{ type:'checkbox', name:'Save region and file annotations (i.e. manual annotations)', checked:true, disabled:false},
                'save_attributes':{ type:'checkbox', name:'Save region and file attributes.', checked:true},
                'save_via_settings':{ type:'checkbox', name:'Save VIA application settings', checked:true},
                //                'save_base64_data':{ type:'checkbox', name:'Save base64 data of images (if present)', checked:false},
                //                'save_images':{type:'checkbox', 'name':'Save images <span class="warning">(WARNING: only recommended for projects containing small number of images)</span>', value:false},
              };

  invoke_with_user_inputs(project_save_confirmed, input, config);
}

function project_save_confirmed(input) {
  if ( input.project_name.value !== _via_settings.project.name ) {
    project_set_name(input.project_name.value);
  }

  // via project
  var _via_project = { '_via_settings': _via_settings,
                       '_via_img_metadata': _via_img_metadata,
                       '_via_attributes': _via_attributes,
                       '_via_data_format_version': '2.0.10',
                       '_via_image_id_list': _via_image_id_list
                     };

  var filename = input.project_name.value + '.json';
  var data_blob = new Blob( [JSON.stringify(_via_project)],
                            {type: 'text/json;charset=utf-8'});

  save_data_to_local_file(data_blob, filename);

  user_input_default_cancel_handler();
}

function project_open_select_project_file() {
  if (invisible_file_input) {
    invisible_file_input.accept = '.json';
    invisible_file_input.onchange = project_open;
    invisible_file_input.removeAttribute('multiple');
    invisible_file_input.click();
  }
}

function project_open(event) {
  var selected_file = event.target.files[0];
  load_text_file(selected_file, project_open_parse_json_file);
}

function project_open_parse_json_file(project_file_data) {
  var d = JSON.parse(project_file_data);
  if ( d['_via_settings'] && d['_via_img_metadata'] && d['_via_attributes'] ) {
    // import settings
    project_import_settings(d['_via_settings']);

    // clear existing data (if any)
    _via_image_id_list = [];
    _via_image_filename_list = [];
    _via_img_count = 0;
    _via_img_metadata = {};
    _via_img_fileref = {};
    _via_img_src = {};
    _via_attributes = { 'region':{}, 'file':{} };
    _via_buffer_remove_all();

    // import image metadata
    _via_img_metadata = {};
    for ( var img_id in d['_via_img_metadata'] ) {
      if('filename' in d['_via_img_metadata'][img_id] &&
         'size' in d['_via_img_metadata'][img_id] &&
         'regions' in d['_via_img_metadata'][img_id] &&
         'file_attributes' in d['_via_img_metadata'][img_id]) {
        if( !d.hasOwnProperty('_via_image_id_list') ) {
          _via_image_id_list.push(img_id);
          _via_image_filename_list.push( d['_via_img_metadata'][img_id].filename );
        }

        set_file_annotations_to_default_value(img_id);
        _via_img_metadata[img_id] = d['_via_img_metadata'][img_id];
        _via_img_count += 1;
      } else {
        console.log('discarding malformed entry for ' + img_id +
                    ': ' + JSON.stringify(d['_via_img_metadata'][img_id]));
      }
    }


    // import image_id_list which records the order of images
    if( d.hasOwnProperty('_via_image_id_list') ) {
      _via_image_id_list = d['_via_image_id_list'];
      for(var img_id_index in d['_via_image_id_list']) {
        var img_id = d['_via_image_id_list'][img_id_index];
        _via_image_filename_list.push(_via_img_metadata[img_id]['filename']);
      }
    }

    // import attributes
    _via_attributes = d['_via_attributes'];
    project_parse_via_attributes_from_img_metadata();
    var fattr_id_list = Object.keys(_via_attributes['file']);
    var rattr_id_list = Object.keys(_via_attributes['region']);
    if ( rattr_id_list.length ) {
      _via_attribute_being_updated = 'region';
      _via_current_attribute_id = rattr_id_list[0];
    } else {
      if ( fattr_id_list.length ) {
        _via_attribute_being_updated = 'file';
        _via_current_attribute_id = fattr_id_list[0];
      }
    }

    if ( _via_settings.core.default_filepath !== '' ) {
      _via_file_resolve_all_to_default_filepath();
    }

    show_message('Imported project [' + _via_settings['project'].name + '] with ' + _via_img_count + ' files.');

    if ( _via_img_count > 0 ) {
      _via_show_img(0);
      update_img_fn_list();
      _via_reload_img_fn_list_table = true;
    }
  } else {
    show_message('Cannot import project from a corrupt file!');
  }
}

function project_parse_via_attributes_from_img_metadata() {
  // parse _via_img_metadata to populate _via_attributes
  var img_id, fa, ra;

  if ( ! _via_attributes.hasOwnProperty('file') ) {
    _via_attributes['file'] = {};
  }
  if ( ! _via_attributes.hasOwnProperty('region') ) {
    _via_attributes['region'] = {};
  }

  for ( img_id in _via_img_metadata ) {
    // file attributes
    for ( fa in _via_img_metadata[img_id].file_attributes ) {
      if ( ! _via_attributes['file'].hasOwnProperty(fa) ) {
        _via_attributes['file'][fa] = {};
        _via_attributes['file'][fa]['type'] = 'text';
      }
    }
    // region attributes
    var ri;
    for ( ri = 0; ri < _via_img_metadata[img_id].regions.length; ++ri ) {
      for ( ra in _via_img_metadata[img_id].regions[ri].region_attributes ) {
        if ( ! _via_attributes['region'].hasOwnProperty(ra) ) {
          _via_attributes['region'][ra] = {};
          _via_attributes['region'][ra]['type'] = 'text';
        }
      }
    }
  }
}

function project_import_settings(s) {
  // @todo find a generic way to import into _via_settings
  // only the components present in s (and not overwrite everything)
  var k1;
  for ( k1 in s ) {
    if ( typeof( s[k1] ) === 'object' ) {
      var k2;
      for ( k2 in s[k1] ) {
        if ( typeof( s[k1][k2] ) === 'object' ) {
          var k3;
          for ( k3 in s[k1][k2] ) {
            _via_settings[k1][k2][k3] = s[k1][k2][k3];
          }
        } else {
          _via_settings[k1][k2] = s[k1][k2];
        }
      }
    } else {
      _via_settings[k1] = s[k1];
    }
  }
}
function project_file_remove() {
  var img_id = _via_image_id_list[_via_image_index]; // Get the current image ID
  var filename = _via_img_metadata[img_id].filename; // Get filename
  var region_count = _via_img_metadata[img_id].regions.length; // Get number of regions

  // Directly remove the image without confirmation
  project_remove_file(_via_image_index);

  // After the image is removed, update the UI accordingly
  if (_via_img_count === 0) {
    _via_current_image_loaded = false;
    show_home_panel();
  } else {
    _via_show_img(_via_image_index); // Show the next image
  }

  _via_reload_img_fn_list_table = true; // Reload the list
  update_img_fn_list(); // Update the image function list

  // Show a message that the image was removed
  show_message('Files removed');
}

function project_remove_file(img_index) {
  if (img_index < 0 || img_index >= _via_img_count) {
    console.log('project_remove_file(): invalid img_index ' + img_index);
    return;
  }
  var img_id = _via_image_id_list[img_index];

  // Remove the image index from all arrays
  _via_image_id_list.splice(img_index, 1);
  _via_image_filename_list.splice(img_index, 1);

  var img_fn_list_index = _via_img_fn_list_img_index_list.indexOf(img_index);
  if (img_fn_list_index !== -1) {
    _via_img_fn_list_img_index_list.splice(img_fn_list_index, 1);
  }

  // Clear all buffers (consider optimizing this part)
  _via_buffer_remove_all(); 
  img_fn_list_clear_css_classname('buffered');

  // Clear the canvas and image metadata
  _via_clear_reg_canvas();
  delete _via_img_metadata[img_id];
  delete _via_img_src[img_id];
  delete _via_img_fileref[img_id];

  _via_img_count -= 1;
}

function project_add_new_file(filename, size, file_id) {
  var img_id = file_id;
  if ( typeof(img_id) === 'undefined' ) {
    if ( typeof(size) === 'undefined' ) {
      size = -1;
    }
    img_id = _via_get_image_id(filename, size);
  }

  if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
    _via_img_metadata[img_id] = new file_metadata(filename, size);
    _via_image_id_list.push(img_id);
    _via_image_filename_list.push(filename);
    _via_img_count += 1;
  }
  return img_id;
}

function project_file_add_local(event) {
  var user_selected_images = event.target.files;
  var original_image_count = _via_img_count;

  var new_img_index_list = [];
  var discarded_file_count = 0;
  for ( var i = 0; i < user_selected_images.length; ++i ) {
    var filetype = user_selected_images[i].type.substr(0, 5);
    if ( filetype === 'image' ) {
      // check which filename in project matches the user selected file
      var img_index = _via_image_filename_list.indexOf(user_selected_images[i].name);
       if( img_index === -1) {
        // a new file was added to project
        var new_img_id = project_add_new_file(user_selected_images[i].name,
                                              user_selected_images[i].size);
        _via_img_fileref[new_img_id] = user_selected_images[i];
        set_file_annotations_to_default_value(new_img_id);
        new_img_index_list.push( _via_image_id_list.indexOf(new_img_id) );
      } else {
        // an existing file was resolved using browser's file selector
        var img_id = _via_image_id_list[img_index];
        _via_img_fileref[img_id] = user_selected_images[i];
        _via_img_metadata[img_id]['size'] = user_selected_images[i].size;
      }
    } else {
      discarded_file_count += 1;
    }
  }

  if ( _via_img_metadata ) {
    var status_msg = 'Loaded ' + new_img_index_list.length + ' images.';
    if ( discarded_file_count ) {
      status_msg += ' ( Discarded ' + discarded_file_count + ' non-image files! )';
    }
    show_message(status_msg);

    if ( new_img_index_list.length ) {
      // show first of newly added image
      _via_show_img( new_img_index_list[0] );
    } else {
      // show original image
      _via_show_img ( _via_image_index );
    }
    update_img_fn_list();
  } else {
    show_message("Please upload some image files!");
  }
}

function project_file_add_abs_path_with_input() {
  var config = {'title':'Add File using Absolute Path' };
  var input = { 'absolute_path': { type:'text', name:'add one absolute path', placeholder:'/home/abhishek/image1.jpg', disabled:false, size:50 },
		'absolute_path_list': { type:'textarea', name:'or, add multiple paths (one path per line)', placeholder:'/home/abhishek/image1.jpg\n/home/abhishek/image2.jpg\n/home/abhishek/image3.png', disabled:false, rows:5, cols:80 }
              };

  invoke_with_user_inputs(project_file_add_abs_path_input_done, input, config);
}

function project_file_add_abs_path_input_done(input) {
  if ( input.absolute_path.value !== '' ) {
    var abs_path  = input.absolute_path.value.trim();
    var img_id    = project_file_add_url(abs_path);
    var img_index = _via_image_id_list.indexOf(img_id);
    _via_show_img(img_index);
    show_message('Added file at absolute path [' + abs_path + ']');
    update_img_fn_list();
    user_input_default_cancel_handler();
  } else {
    if ( input.absolute_path_list.value !== '' ) {
      var absolute_path_list_str = input.absolute_path_list.value;
      import_files_url_from_csv(absolute_path_list_str);
    }
  }
}

function project_file_add_url_with_input() {
  var config = {'title':'Add File using URL' };
  var input = { 'url': { type:'text', name:'add one URL', placeholder:'http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg', disabled:false, size:50 },
		'url_list': { type:'textarea', name:'or, add multiple URL (one url per line)', placeholder:'http://www.example.com/image1.jpg\nhttp://www.example.com/image2.jpg\nhttp://www.example.com/image3.png', disabled:false, rows:5, cols:80 }
              };

  invoke_with_user_inputs(project_file_add_url_input_done, input, config);
}

function project_file_add_url_input_done(input) {
  if ( input.url.value !== '' ) {
    var url = input.url.value.trim();
    var img_id    = project_file_add_url(url);
    var img_index = _via_image_id_list.indexOf(img_id);
    show_message('Added file at url [' + url + ']');
    update_img_fn_list();
    _via_show_img(img_index);
    user_input_default_cancel_handler();
  } else {
    if ( input.url_list.value !== '' ) {
      var url_list_str = input.url_list.value;
      import_files_url_from_csv(url_list_str);
    }
  }
}

function project_file_add_url(url) {
  if ( url !== '' ) {
    var size = -1; // convention: files added using url have size = -1
    var img_id   = _via_get_image_id(url, size);

    if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
      img_id = project_add_new_file(url);
      _via_img_src[img_id] = _via_img_metadata[img_id].filename;
      set_file_annotations_to_default_value(img_id);
      return img_id;
    }
  }
}

function project_file_add_base64(filename, base64) {
  var size = -1; // convention: files added using url have size = -1
  var img_id   = _via_get_image_id(filename, size);

  if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
    img_id = project_add_new_file(filename, size);
    _via_img_src[img_id] = base64;
    set_file_annotations_to_default_value(img_id);
  }
}

function project_file_load_on_fail(img_index) {
  var img_id = _via_image_id_list[img_index];
  _via_img_src[img_id] = '';
  _via_image_load_error[img_index] = true;
  img_fn_list_ith_entry_error(img_index, true);
}

function project_file_load_on_success(img_index) {
  _via_image_load_error[img_index] = false;
  img_fn_list_ith_entry_error(img_index, false);
}

function project_settings_toggle() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.SETTINGS ) {
    show_single_image_view();
  } else {
    project_settings_show();
  }
}

function project_settings_show() {
  set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.SETTINGS);
}

function project_filepath_add_from_input(p, button) {
  var new_path = document.getElementById(p).value.trim();
  var img_index = parseInt(button.getAttribute('value'));
  project_filepath_add(new_path);
  _via_show_img(img_index);
}

function project_filepath_add(new_path) {
  if ( path === '' ) {
    return;
  }

  if ( _via_settings.core.filepath.hasOwnProperty(new_path) ) {
    return;
  } else {
    var largest_order = 0;
    var path;
    for ( path in _via_settings.core.filepath ) {
      if ( _via_settings.core.filepath[path] > largest_order ) {
        largest_order = _via_settings.core.filepath[path];
      }
    }
    _via_settings.core.filepath[new_path] = largest_order + 1;

  }
}

function project_filepath_del(path) {
  if ( _via_settings.core.filepath.hasOwnProperty(path) ) {
    delete _via_settings.core.filepath[path];
  }
}

function project_save_attributes() {
  var blob_attr = {type: 'application/json;charset=utf-8'};
  var all_region_data_blob = new Blob( [ JSON.stringify(_via_attributes) ], blob_attr);

  save_data_to_local_file(all_region_data_blob, _via_settings.project.name + '_attributes.json');
}

function project_import_attributes_from_file(event) {
  var selected_files = event.target.files;
  for ( var i = 0; i < selected_files.length; ++i ) {
    var file = selected_files[i];
    load_text_file(file, project_import_attributes_from_json);
  }
}

function project_import_attributes_from_json(data) {
  try {
    var d = JSON.parse(data);
    var attr;
    var fattr_count = 0;
    var rattr_count = 0;
    // process file attributes
    for ( attr in d['file'] ) {
      _via_attributes['file'][attr] = JSON.parse( JSON.stringify( d['file'][attr] ) );
      fattr_count += 1;
    }

    // process region attributes
    for ( attr in d['region'] ) {
      _via_attributes['region'][attr] = JSON.parse( JSON.stringify( d['region'][attr] ) );
      rattr_count += 1;
    }

    if ( fattr_count > 0 || rattr_count > 0 ) {
      var fattr_id_list = Object.keys(_via_attributes['file']);
      var rattr_id_list = Object.keys(_via_attributes['region']);
      if ( rattr_id_list.length ) {
        _via_attribute_being_updated = 'region';
        _via_current_attribute_id = rattr_id_list[0];
      } else {
        if ( fattr_id_list.length ) {
          _via_attribute_being_updated = 'file';
          _via_current_attribute_id = fattr_id_list[0];
        }
      }
      attribute_update_panel_set_active_button();
      update_attributes_update_panel();
      annotation_editor_update_content();
    }
    show_message('Imported ' + fattr_count + ' file attributes and '
                 + rattr_count + ' region attributes');
  } catch (error) {
    show_message('Failed to import attributes: [' + error + ']');
  }
}

//
// image grid
//
function image_grid_init() {
  var p = document.getElementById('image_grid_content');
  p.focus();
  p.addEventListener('mousedown', image_grid_mousedown_handler, false);
  p.addEventListener('mouseup', image_grid_mouseup_handler, false);
  p.addEventListener('dblclick', image_grid_dblclick_handler, false);

  image_grid_set_content_panel_height_fixed();

  // select policy as defined in settings
  var i, option;
  var p = document.getElementById('image_grid_show_image_policy');
  var n = p.options.length;
  for ( i = 0; i < n; ++i ) {
    if ( p.options[i].value === _via_settings.ui.image_grid.show_image_policy ) {
      p.selectedIndex = i;
      break;
    }
  }
}

function image_grid_update() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_set_content( _via_image_grid_img_index_list );
  }
}

function image_grid_toggle() {
  var p = document.getElementById('toolbar_image_grid_toggle');
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID ) {
    image_grid_clear_all_groups();
    show_single_image_view();
  } else {
    show_image_grid_view();
  }
}

function image_grid_show_all_project_images() {
  var all_img_index_list = [];
  var i, n;
  //n = _via_image_id_list.length;
  n = _via_img_fn_list_img_index_list.length;
  for ( i = 0; i < n; ++i ) {
    all_img_index_list.push( _via_img_fn_list_img_index_list[i] );
  }
  image_grid_clear_all_groups();

  var p = document.getElementById('image_grid_toolbar_group_by_select');
  p.selectedIndex = 0;

  image_grid_set_content(all_img_index_list);
}

function image_grid_clear_all_groups() {
  var i, n;
  n = _via_image_grid_group_var.length;
  for ( i = 0; i < n; ++i ) {
    image_grid_remove_html_group_panel( _via_image_grid_group_var[i] );
    image_grid_group_by_select_set_disabled( _via_image_grid_group_var[i].type,
                                             _via_image_grid_group_var[i].name,
                                             false);
  }
  _via_image_grid_group = {};
  _via_image_grid_group_var = [];

}

function image_grid_set_content(img_index_list) {
  if ( img_index_list.length === 0 ) {
    return;
  }
  if ( _via_image_grid_load_ongoing ) {
    return;
  }

  _via_image_grid_img_index_list = img_index_list.slice(0);
  _via_image_grid_selected_img_index_list = img_index_list.slice(0);

  document.getElementById('image_grid_group_by_img_count').innerHTML = _via_image_grid_img_index_list.length;

  _via_image_grid_page_first_index    = 0;
  _via_image_grid_page_last_index     = null;
  _via_image_grid_stack_prev_page     = [];
  _via_image_grid_page_img_index_list = [];

  image_grid_clear_content();
  image_grid_set_content_panel_height_fixed();
  _via_image_grid_load_ongoing = true;

  var n = _via_image_grid_img_index_list.length;
  switch ( _via_settings.ui.image_grid.show_image_policy ) {
  case 'all':
    _via_image_grid_page_img_index_list = _via_image_grid_img_index_list.slice(0);
    break;
  case 'first_mid_last':
    if ( n < 3 ) {
      var i;
      for ( i = 0; i < n; ++i ) {
        _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[i] );
      }
    } else {
      _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[0] );
      _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[ Math.floor(n/2) ] );
      _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[n-1] );
    }
    break;
  case 'even_indexed':
    var i;
    for ( i = 0; i < n; ++i ) {
      if ( i % 2 !== 0 ) { // since the user views (i+1) based indexing
        _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[i] );
      }
    }
    break;
  case 'odd_indexed':
    var i;
    for ( i = 0; i < n; ++i ) {
      if ( i % 2 === 0 ) { // since the user views (i+1) based indexing
        _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[i] );
      }
    }
    break;
  case 'gap5':  // fallback
  case 'gap25': // fallback
  case 'gap50': // fallback
    var del = parseInt( _via_settings.ui.image_grid.show_image_policy.substr( 'gap'.length ) );
    var i;
    for ( i = 0; i < n; i = i + del ) {
      _via_image_grid_page_img_index_list.push( _via_image_grid_img_index_list[i] );
    }
    break;
  }

  _via_image_grid_visible_img_index_list = [];

  image_grid_update_sel_count_html();
  annotation_editor_update_content();

  image_grid_content_append_img( _via_image_grid_page_first_index );

  show_message('[Click] toggles selection, ' +
               '[Shift + Click] selects everything a image, ' +
               '[Click] or [Ctrl + Click] removes selection of all subsequent or preceeding images.');
}

function image_grid_clear_content() {
  var img_container = document.getElementById('image_grid_content_img');
  var img_rshape = document.getElementById('image_grid_content_rshape');
  img_container.innerHTML = '';
  img_rshape.innerHTML = '';
  _via_image_grid_visible_img_index_list = [];
}

function image_grid_set_content_panel_height_fixed() {
  var pc = document.getElementById('image_grid_content');
  var de = document.documentElement;
  pc.style.height = (de.clientHeight - 5.5*ui_top_panel.offsetHeight) + 'px';
}

// We do not know how many images will fit in the display area.
// Therefore, we add images one-by-one until overflow of parent
// container is detected.
function image_grid_content_append_img( img_grid_index ) {
  var img_index   = _via_image_grid_page_img_index_list[img_grid_index];
  var html_img_id = image_grid_get_html_img_id(img_index);
  var img_id      = _via_image_id_list[img_index];
  var e = document.createElement('img');
  if ( _via_img_fileref[img_id] instanceof File ) {
    var img_reader = new FileReader();
    img_reader.addEventListener( "error", function() {
      //@todo
    }, false);
    img_reader.addEventListener( "load", function() {
      e.src = img_reader.result;
    }, false);
    img_reader.readAsDataURL( _via_img_fileref[img_id] );
  } else {
    e.src = _via_img_src[img_id];
  }
  e.setAttribute('id', html_img_id);
  e.setAttribute('height', _via_settings.ui.image_grid.img_height + 'px');
  e.setAttribute('title', '[' + (img_index+1) + '] ' + _via_img_metadata[img_id].filename);

  e.addEventListener('load', image_grid_on_img_load, false);
  e.addEventListener('error', image_grid_on_img_error, false);
  document.getElementById('image_grid_content_img').appendChild(e);
}

function image_grid_on_img_load(e) {
  var img = e.target;
  var img_index = image_grid_parse_html_img_id(img.id);
  project_file_load_on_success(img_index);

  image_grid_add_img_if_possible(img);
}

function image_grid_on_img_error(e) {
  var img       = e.target;
  var img_index = image_grid_parse_html_img_id(img.id);
  project_file_load_on_fail(img_index);
  image_grid_add_img_if_possible(img);
}

function image_grid_add_img_if_possible(img) {
  var img_index = image_grid_parse_html_img_id(img.id);

  var p = document.getElementById('image_grid_content_img');
  var img_bottom_right_corner = parseInt(img.offsetTop) + parseInt(img.height);
  if ( p.clientHeight < img_bottom_right_corner ) {
    // stop as addition of this image caused overflow of parent container
    var img_container = document.getElementById('image_grid_content_img');
    img_container.removeChild(img);

    if ( _via_settings.ui.image_grid.show_region_shape ) {
      image_grid_page_show_all_regions();
    }
    _via_image_grid_load_ongoing = false;

    var index = _via_image_grid_page_img_index_list.indexOf(img_index);
    _via_image_grid_page_last_index = index;

    // setup prev, next navigation
    var info = document.getElementById('image_grid_nav');
    var html = [];
    var first_index = _via_image_grid_page_first_index;
    var last_index  = _via_image_grid_page_last_index - 1;
    html.push('<span>Showing&nbsp;' + (first_index + 1) +
              ' to ' + (last_index + 1) + '&nbsp;:</span>');
    if ( _via_image_grid_stack_prev_page.length ) {
      html.push('<span class="text_button" onclick="image_grid_page_prev()">Prev</span>');
    } else {
      html.push('<span>Prev</span>');
    }
    html.push('<span class="text_button" onclick="image_grid_page_next()">Next</span');
    info.innerHTML = html.join('');
  } else {
    // process this image and trigger addition of next image in sequence
    var img_fn_list_index = _via_image_grid_page_img_index_list.indexOf(img_index);
    var next_img_fn_list_index = img_fn_list_index + 1;

    _via_image_grid_visible_img_index_list.push( img_index );
    var is_selected = ( _via_image_grid_selected_img_index_list.indexOf(img_index) !== -1 );
    if ( ! is_selected ) {
      image_grid_update_img_select(img_index, 'unselect');
    }

    if ( next_img_fn_list_index !==  _via_image_grid_page_img_index_list.length ) {
      if ( _via_image_grid_load_ongoing ) {
        image_grid_content_append_img( img_fn_list_index + 1 );
      } else {
        // image grid load operation was cancelled
        _via_image_grid_page_last_index = _via_image_grid_page_first_index; // load this page again

        var info = document.getElementById('image_grid_nav');
        var html = [];
        html.push('<span>Cancelled&nbsp;:</span>');
        if ( _via_image_grid_stack_prev_page.length ) {
          html.push('<span class="text_button" onclick="image_grid_page_prev()">Prev</span>');
        } else {
          html.push('<span>Prev</span>');
        }
        html.push('<span class="text_button" onclick="image_grid_page_next()">Next</span');
        info.innerHTML = html.join('');
      }
    } else {
      // last page
      var index = _via_image_grid_page_img_index_list.indexOf(img_index);
      _via_image_grid_page_last_index = index;

      if ( _via_settings.ui.image_grid.show_region_shape ) {
        image_grid_page_show_all_regions();
      }
      _via_image_grid_load_ongoing = false;

      // setup prev, next navigation
      var info = document.getElementById('image_grid_nav');
      var html = [];
      var first_index = _via_image_grid_page_first_index;
      var last_index  = _via_image_grid_page_last_index;
      html.push('<span>Showing&nbsp;' + (first_index + 1) +
                ' to ' + (last_index + 1) + ' (end)&nbsp;</span>');
      if ( _via_image_grid_stack_prev_page.length ) {
        html.push('<span class="text_button" onclick="image_grid_page_prev()">Prev</span>');
      } else {
        html.push('<span>Prev</span>');
      }
      html.push('<span>Next</span');

      info.innerHTML = html.join('');
    }
  }
}

function image_grid_onchange_show_image_policy(p) {
  _via_settings.ui.image_grid.show_image_policy = p.options[p.selectedIndex].value;
  image_grid_set_content(_via_image_grid_img_index_list);
}

function image_grid_page_show_all_regions() {
  var all_promises = [];
  if ( _via_settings.ui.image_grid.show_region_shape ) {
    var p = document.getElementById('image_grid_content_img');
    var n = p.childNodes.length;
    var i;
    for ( i = 0; i < n; ++i ) {
      // draw region shape into global canvas for image grid
      var img_index = image_grid_parse_html_img_id( p.childNodes[i].id );
      var img_param = []; // [width, height, originalWidth, originalHeight, x, y]
      img_param.push( parseInt(p.childNodes[i].width) );
      img_param.push( parseInt(p.childNodes[i].height) );
      img_param.push( parseInt(p.childNodes[i].naturalWidth) );
      img_param.push( parseInt(p.childNodes[i].naturalHeight) );
      img_param.push( parseInt(p.childNodes[i].offsetLeft) + parseInt(p.childNodes[i].clientLeft) );
      img_param.push( parseInt(p.childNodes[i].offsetTop) + parseInt(p.childNodes[i].clientTop) );
      var promise = image_grid_show_region_shape( img_index, img_param );
      all_promises.push( promise );
    }
    // @todo: ensure that all promises are fulfilled
  }
}

function image_grid_is_region_in_current_group(r) {
  var i, n;
  n = _via_image_grid_group_var.length;
  if ( n === 0 ) {
    return true;
  }

  for ( i = 0; i < n; ++i ) {
    if ( _via_image_grid_group_var[i].type === 'region' ) {
      var group_value = _via_image_grid_group_var[i].values[ _via_image_grid_group_var[i].current_value_index ];
      if ( r[_via_image_grid_group_var[i].name] != group_value ) {
        return false;
      }
    }
  }
  return true;
}

function image_grid_show_region_shape(img_index, img_param) {
  return new Promise( function(ok_callback, err_callback) {
    var i;
    var img_id = _via_image_id_list[img_index];
    var html_img_id = image_grid_get_html_img_id(img_index);
    var n = _via_img_metadata[img_id].regions.length;
    var is_in_group = false;
    for ( i = 0; i < n; ++i ) {
      if ( ! image_grid_is_region_in_current_group( _via_img_metadata[img_id].regions[i].region_attributes ) ) {
        // skip drawing this region which is not in current group
        continue;
      }

      var r = _via_img_metadata[img_id].regions[i].shape_attributes;
      var dimg; // region coordinates in original image space
      switch( r.name ) {
      case VIA_REGION_SHAPE.RECT:
        dimg = [ r['x'], r['y'], r['x']+r['width'], r['y']+r['height'] ];
        break;
      case VIA_REGION_SHAPE.CIRCLE:
        dimg = [ r['cx'], r['cy'], r['cx']+r['r'], r['cy']+r['r'] ];
        break;
      case VIA_REGION_SHAPE.ELLIPSE:
        dimg = [ r['cx'], r['cy'], r['cx']+r['rx'], r['cy']+r['ry'] ];
        break;
      case VIA_REGION_SHAPE.POLYLINE: // handled by POLYGON
      case VIA_REGION_SHAPE.POLYGON:
        var j;
        dimg = [];
        for ( j = 0; j < r['all_points_x'].length; ++j ) {
          dimg.push( r['all_points_x'][j] );
          dimg.push( r['all_points_y'][j] );
        }
        break;
      case VIA_REGION_SHAPE.POINT:
        dimg = [ r['cx'], r['cy'] ];
        break;
      }
      var scale_factor = img_param[1] / img_param[3]; // new_height / original height
      var offset_x     = img_param[4];
      var offset_y     = img_param[5];
      var r2 = new _via_region( r.name, i, dimg, scale_factor, offset_x, offset_y);
      var r2_svg = r2.get_svg_element();
      r2_svg.setAttribute('id', image_grid_get_html_region_id(img_index, i));
      r2_svg.setAttribute('class', html_img_id);
      r2_svg.setAttribute('fill',         _via_settings.ui.image_grid.rshape_fill);
      //r2_svg.setAttribute('fill-opacity', _via_settings.ui.image_grid.rshape_fill_opacity);
      r2_svg.setAttribute('stroke',       _via_settings.ui.image_grid.rshape_stroke);
      r2_svg.setAttribute('stroke-width', _via_settings.ui.image_grid.rshape_stroke_width);

      document.getElementById('image_grid_content_rshape').appendChild(r2_svg);
    }
  });
}

function image_grid_image_size_increase() {
  var new_img_height = _via_settings.ui.image_grid.img_height + VIA_IMAGE_GRID_IMG_HEIGHT_CHANGE;
  _via_settings.ui.image_grid.img_height = new_img_height;

  _via_image_grid_page_last_index = null;
  image_grid_update();
}

function image_grid_image_size_decrease() {
  var new_img_height = _via_settings.ui.image_grid.img_height - VIA_IMAGE_GRID_IMG_HEIGHT_CHANGE;
  if ( new_img_height > 1 ) {
    _via_settings.ui.image_grid.img_height = new_img_height;
    _via_image_grid_page_last_index = null;
    image_grid_update();
  }
}

function image_grid_image_size_reset() {
  var new_img_height = _via_settings.ui.image_grid.img_height;
  if ( new_img_height > 1 ) {
    _via_settings.ui.image_grid.img_height = new_img_height;
    _via_image_grid_page_last_index = null;
    image_grid_update();
  }
}

function image_grid_mousedown_handler(e) {
  e.preventDefault();
  _via_image_grid_mousedown_img_index = image_grid_parse_html_img_id(e.target.id);
}

function image_grid_mouseup_handler(e) {
  e.preventDefault();
  var last_mouseup_img_index = _via_image_grid_mouseup_img_index;
  _via_image_grid_mouseup_img_index = image_grid_parse_html_img_id(e.target.id);
  if ( isNaN(_via_image_grid_mousedown_img_index) ||
       isNaN(_via_image_grid_mouseup_img_index)) {
    last_mouseup_img_index = _via_image_grid_img_index_list[0];
    image_grid_group_select_none();
    return;
  }

  var mousedown_img_arr_index = _via_image_grid_img_index_list.indexOf(_via_image_grid_mousedown_img_index);
  var mouseup_img_arr_index = _via_image_grid_img_index_list.indexOf(_via_image_grid_mouseup_img_index);

  var start = -1;
  var end   = -1;
  var operation = 'select'; // {'select', 'unselect', 'toggle'}
  if ( mousedown_img_arr_index === mouseup_img_arr_index ) {
    if ( e.shiftKey ) {
      // select all elements until this element
      start = _via_image_grid_img_index_list.indexOf(last_mouseup_img_index) + 1;
      end   = mouseup_img_arr_index + 1;
    } else {
      // toggle selection of single image
      start = mousedown_img_arr_index;
      end   = start + 1;
      operation = 'toggle';
    }
  } else {
    if ( mousedown_img_arr_index < mouseup_img_arr_index ) {
      start = mousedown_img_arr_index;
      end   = mouseup_img_arr_index + 1;
    } else {
      start = mouseup_img_arr_index + 1;
      end   = mousedown_img_arr_index;
    }
    operation = 'toggle';
  }

  if ( start > end ) {
    return;
  }

  var i, img_index;
  for ( i = start; i < end; ++i ) {
    img_index = _via_image_grid_img_index_list[i];
    image_grid_update_img_select(img_index, operation);
  }
  image_grid_update_sel_count_html();
  annotation_editor_update_content();
}

function image_grid_update_sel_count_html() {
  document.getElementById('image_grid_group_by_sel_img_count').innerHTML = _via_image_grid_selected_img_index_list.length;
}

// state \in {'select', 'unselect', 'toggle'}
function image_grid_update_img_select(img_index, state) {
  var html_img_id = image_grid_get_html_img_id(img_index);
  var is_selected = ( _via_image_grid_selected_img_index_list.indexOf(img_index) !== -1 );
  if (state === 'toggle' ) {
    if ( is_selected ) {
      state = 'unselect';
    } else {
      state = 'select';
    }
  }

  switch(state) {
  case 'select':
    if ( ! is_selected ) {
      _via_image_grid_selected_img_index_list.push(img_index);
    }
    if ( _via_image_grid_visible_img_index_list.indexOf(img_index) !== -1 ) {
      document.getElementById(html_img_id).classList.remove('not_sel');
    }
    break;
  case 'unselect':
    if ( is_selected ) {
      var arr_index = _via_image_grid_selected_img_index_list.indexOf(img_index);
      _via_image_grid_selected_img_index_list.splice(arr_index, 1);
    }
    if ( _via_image_grid_visible_img_index_list.indexOf(img_index) !== -1 ) {
      document.getElementById(html_img_id).classList.add('not_sel');
    }
    break;
  }
}

function image_grid_group_select_all() {
  image_grid_group_set_all_selection_state('select');
  image_grid_update_sel_count_html();
  annotation_editor_update_content();
  show_message('Selected all images in the current group');
}

function image_grid_group_select_none() {
  image_grid_group_set_all_selection_state('unselect');
  image_grid_update_sel_count_html();
  annotation_editor_update_content();
  show_message('Removed selection of all images in the current group');
}

function image_grid_group_set_all_selection_state(state) {
  var i, img_index;
  for ( i = 0; i < _via_image_grid_img_index_list.length; ++i ) {
    img_index = _via_image_grid_img_index_list[i];
    image_grid_update_img_select(img_index, state);
  }
}

function image_grid_group_toggle_select_all() {
  if ( _via_image_grid_selected_img_index_list.length === _via_image_grid_img_index_list.length ) {
    image_grid_group_select_none();
  } else {
    image_grid_group_select_all();
  }
}

function image_grid_parse_html_img_id(html_img_id) {
  var img_index = html_img_id.substr(2);
  return parseInt(img_index);
}

function image_grid_get_html_img_id(img_index) {
  return 'im' + img_index;
}

function image_grid_parse_html_region_id(html_region_id) {
  var chunks = html_region_id.split('_');
  if ( chunks.length === 2 ) {
    var img_index = parseInt(chunks[0].substr(2));
    var region_id = parseInt(chunks[1].substr(2));
    return {'img_index':img_index, 'region_id':region_id};
  } else {
    console.log('image_grid_parse_html_region_id(): invalid html_region_id');
    return {};
  }
}

function image_grid_get_html_region_id(img_index, region_id) {
  return image_grid_get_html_img_id(img_index) + '_rs' + region_id;
}

function image_grid_dblclick_handler(e) {
  _via_image_index = image_grid_parse_html_img_id(e.target.id);
  show_single_image_view();
}

function image_grid_toolbar_update_group_by_select() {
  var p = document.getElementById('image_grid_toolbar_group_by_select');
  p.innerHTML = '';

  var o = document.createElement('option');
  o.setAttribute('value', '');
  o.setAttribute('selected', 'selected');
  o.innerHTML = 'All Images';
  p.appendChild(o);

  // add file attributes
  var fattr;
  for ( fattr in _via_attributes['file'] ) {
    var o = document.createElement('option');
    o.setAttribute('value', image_grid_toolbar_group_by_select_get_html_id('file', fattr));
    o.innerHTML = '[file] ' + fattr;
    p.appendChild(o);
  }

  // add region attributes
  var rattr;
  for ( rattr in _via_attributes['region'] ) {
    var o = document.createElement('option');
    o.setAttribute('value', image_grid_toolbar_group_by_select_get_html_id('region', rattr));
    o.innerHTML = '[region] ' + rattr;
    p.appendChild(o);
  }
}

function image_grid_toolbar_group_by_select_get_html_id(type, name) {
  if ( type === 'file' ) {
    return 'f_' + name;
  }
  if ( type === 'region' ) {
    return 'r_' + name;
  }
}

function image_grid_toolbar_group_by_select_parse_html_id(id) {
  if ( id.startsWith('f_') ) {
    return { 'attr_type':'file', 'attr_name':id.substr(2) };
  }
  if ( id.startsWith('r_') ) {
    return { 'attr_type':'region', 'attr_name':id.substr(2) };
  }
}

function image_grid_toolbar_onchange_group_by_select(p) {
  if ( p.options[p.selectedIndex].value === '' ) {
    image_grid_show_all_project_images();
    return;
  }

  var v = image_grid_toolbar_group_by_select_parse_html_id( p.options[p.selectedIndex].value );
  var attr_type = v.attr_type;
  var attr_name = v.attr_name;
  image_grid_group_by(attr_type, attr_name);

  image_grid_group_by_select_set_disabled(attr_type, attr_name, true);
  p.blur(); // to avoid adding new groups using keyboard keys as dropdown is still in focus
}

function image_grid_remove_html_group_panel(d) {
  var p = document.getElementById('group_toolbar_' + d.group_index);
  document.getElementById('image_grid_group_panel').removeChild(p);
}

function image_grid_add_html_group_panel(d) {
  var p = document.createElement('div');
  p.classList.add('image_grid_group_toolbar');
  p.setAttribute('id', 'group_toolbar_' + d.group_index);

  var del = document.createElement('span');
  del.classList.add('text_button');
  del.setAttribute('onclick', 'image_grid_remove_group_by(this)');
  del.innerHTML = '&times;';
  p.appendChild(del);

  var prev = document.createElement('button');
  prev.innerHTML = '<';
  prev.setAttribute('value', d.group_index);
  prev.setAttribute('onclick', 'image_grid_group_prev(this)');
  p.appendChild(prev);

  var sel = document.createElement('select');
  sel.setAttribute('id', image_grid_group_select_get_html_id(d.group_index));
  sel.setAttribute('onchange', 'image_grid_group_value_onchange(this)');
  var i, value;
  var n = d.values.length;
  var current_value = d.values[ d.current_value_index ];
  for ( i = 0; i < n; ++i ) {
    value = d.values[i];
    var o = document.createElement('option');
    o.setAttribute('value', value);
    o.innerHTML = (i+1) + '/' + n + ': ' + d.name + ' = ' + value;
    if ( value === current_value ) {
      o.setAttribute('selected', 'selected');
    }

    sel.appendChild(o);
  }
  p.appendChild(sel);

  var next = document.createElement('button');
  next.innerHTML = '>';
  next.setAttribute('value', d.group_index);
  next.setAttribute('onclick', 'image_grid_group_next(this)');
  p.appendChild(next);

  document.getElementById('image_grid_group_panel').appendChild(p);
}

function image_grid_group_panel_set_selected_value(group_index) {
  var sel = document.getElementById(image_grid_group_select_get_html_id(group_index));
  sel.selectedIndex = _via_image_grid_group_var[group_index].current_value_index;
}

function image_grid_group_panel_set_options(group_index) {
  var sel = document.getElementById(image_grid_group_select_get_html_id(group_index));
  sel.innerHTML = '';

  var i, value;
  var n = _via_image_grid_group_var[group_index].values.length;
  var name = _via_image_grid_group_var[group_index].name;
  var current_value = _via_image_grid_group_var[group_index].values[ _via_image_grid_group_var[group_index].current_value_index ]
  for ( i = 0; i < n; ++i ) {
    value = _via_image_grid_group_var[group_index].values[i];
    var o = document.createElement('option');
    o.setAttribute('value', value);
    o.innerHTML = (i+1) + '/' + n + ': ' + name + ' = ' + value;
    if ( value === current_value ) {
      o.setAttribute('selected', 'selected');
    }
    sel.appendChild(o);
  }
}

function image_grid_group_select_get_html_id(group_index) {
  return 'gi_' + group_index;
}

function image_grid_group_select_parse_html_id(id) {
  return parseInt(id.substr(3));
}

function image_grid_group_by_select_set_disabled(type, name, is_disabled) {
  var p = document.getElementById('image_grid_toolbar_group_by_select');
  var sel_option_value = image_grid_toolbar_group_by_select_get_html_id(type, name);

  var n = p.options.length;
  var option_value;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( sel_option_value === p.options[i].value ) {
      if ( is_disabled ) {
        p.options[i].setAttribute('disabled', 'disabled');
      } else {
        p.options[i].removeAttribute('disabled');
      }
      break;
    }
  }
}

function image_grid_remove_group_by(p) {
  var prefix = 'group_toolbar_';
  var group_index = parseInt( p.parentNode.id.substr( prefix.length ) );

  if ( group_index === 0 ) {
    image_grid_show_all_project_images();
  } else {
    // merge all groups that are child of group_index
    image_grid_group_by_merge(_via_image_grid_group, 0, group_index);

    var n = _via_image_grid_group_var.length;
    var p = document.getElementById('image_grid_group_panel');
    var group_panel_id;
    var i;
    for ( i = group_index; i < n; ++i ) {
      image_grid_remove_html_group_panel( _via_image_grid_group_var[i] );
      image_grid_group_by_select_set_disabled( _via_image_grid_group_var[i].type,
                                               _via_image_grid_group_var[i].name,
                                               false);
    }
    _via_image_grid_group_var.splice(group_index);

    image_grid_set_content_to_current_group();
  }
}

function image_grid_group_by(type, name) {
  if ( Object.keys(_via_image_grid_group).length === 0 ) {
    // first group
    var img_index_array = [];
    var n = _via_img_fn_list_img_index_list.length;
    var i;
    for ( i = 0; i < n; ++i ) {
      img_index_array.push( _via_img_fn_list_img_index_list[i] );
    }

    _via_image_grid_group = image_grid_split_array_to_group(img_index_array, type, name);
    var new_group_values = Object.keys(_via_image_grid_group);
    _via_image_grid_group_var = [];
    _via_image_grid_group_var.push( { 'type':type, 'name':name, 'current_value_index':0, 'values':new_group_values, 'group_index':0 } );

    image_grid_add_html_group_panel(_via_image_grid_group_var[0]);
  } else {
    image_grid_group_split_all_arrays( _via_image_grid_group, type, name );

    var i, n, value;
    var current_group_value = _via_image_grid_group;
    n = _via_image_grid_group_var.length;

    for ( i = 0; i < n; ++i ) {
      value = _via_image_grid_group_var[i].values[ _via_image_grid_group_var[i].current_value_index ];
      current_group_value = current_group_value[ value ];
    }
    var new_group_values = Object.keys(current_group_value);
    var group_var_index = _via_image_grid_group_var.length;
    _via_image_grid_group_var.push( { 'type':type, 'name':name, 'current_value_index':0, 'values':new_group_values, 'group_index':group_var_index } );
    image_grid_add_html_group_panel( _via_image_grid_group_var[group_var_index] );
  }

  image_grid_set_content_to_current_group();
}

function image_grid_group_by_merge(group, current_level, target_level) {
  var child_value;
  var group_data = [];
  if ( current_level === target_level ) {
    return image_grid_group_by_collapse(group);
  } else {
    for ( child_value in group ) {
      group[child_value] = image_grid_group_by_merge(group[child_value], current_level + 1, target_level);
    }
  }
}

function image_grid_group_by_collapse(group) {
  var child_value;
  var child_collapsed_value;
  var group_data = [];
  for ( child_value in group ) {
    if ( Array.isArray(group[child_value]) ) {
      group_data = group_data.concat(group[child_value]);
    } else {
      group_data = group_data.concat(image_grid_group_by_collapse(group[child_value]));
    }
  }
  return group_data;
}

// recursively collapse all arrays to list
function image_grid_group_split_all_arrays(group, type, name) {
  if ( Array.isArray(group) ) {
    return image_grid_split_array_to_group(group, type, name);
  } else {
    var group_value;
    for ( group_value in group ) {
      if ( Array.isArray( group[group_value] ) ) {
        group[group_value] = image_grid_split_array_to_group(group[group_value], type, name);
      } else {
        image_grid_group_split_all_arrays(group[group_value], type, name);
      }
    }
  }
}

function image_grid_split_array_to_group(img_index_array, attr_type, attr_name) {
  var grp = {};
  var img_index, img_id, i;
  var n = img_index_array.length;
  var attr_value;

  switch(attr_type) {
  case 'file':
    for ( i = 0; i < n; ++i ) {
      img_index = img_index_array[i];
      img_id = _via_image_id_list[img_index];
      if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty(attr_name) ) {
        attr_value = _via_img_metadata[img_id].file_attributes[attr_name];

        if ( ! grp.hasOwnProperty(attr_value) ) {
          grp[attr_value] = [];
        }
        grp[attr_value].push(img_index);
      }
    }
    break;
  case 'region':
    var j;
    var region_count;
    for ( i = 0; i < n; ++i ) {
      img_index    = img_index_array[i];
      img_id       = _via_image_id_list[img_index];
      region_count = _via_img_metadata[img_id].regions.length;
      for ( j = 0; j < region_count; ++j ) {
        if ( _via_img_metadata[img_id].regions[j].region_attributes.hasOwnProperty(attr_name) ) {
          attr_value = _via_img_metadata[img_id].regions[j].region_attributes[attr_name];

          if ( ! grp.hasOwnProperty(attr_value) ) {
            grp[attr_value] = [];
          }
          if ( grp[attr_value].includes(img_index) ) {
            continue;
          } else {
            grp[attr_value].push(img_index);
          }
        }
      }
    }
    break;
  }
  return grp;
}

function image_grid_group_next(p) {
  var group_index = parseInt( p.value );
  var group_value_list = _via_image_grid_group_var[group_index].values;
  var n = group_value_list.length;
  var current_index = _via_image_grid_group_var[group_index].current_value_index;
  var next_index = current_index + 1;
  if ( next_index >= n ) {
    if ( group_index === 0 ) {
      next_index = next_index - n;
      image_grid_jump_to_group(group_index, next_index);
    } else {
      // next of parent group
      var parent_group_index = group_index - 1;
      var parent_current_val_index = _via_image_grid_group_var[parent_group_index].current_value_index;
      var parent_next_val_index = parent_current_val_index + 1;
      while ( parent_group_index !== 0 ) {
        if ( parent_next_val_index >= _via_image_grid_group_var[parent_group_index].values.length ) {
          parent_group_index = group_index - 1;
          parent_current_val_index = _via_image_grid_group_var[parent_group_index].current_value_index;
          parent_next_val_index = parent_current_val_index + 1;
        } else {
          break;
        }
      }

      if ( parent_next_val_index >= _via_image_grid_group_var[parent_group_index].values.length ) {
        parent_next_val_index = 0;
      }
      image_grid_jump_to_group(parent_group_index, parent_next_val_index);
    }
  } else {
    image_grid_jump_to_group(group_index, next_index);
  }
  image_grid_set_content_to_current_group();
}

function image_grid_group_prev(p) {
  var group_index = parseInt( p.value );
  var group_value_list = _via_image_grid_group_var[group_index].values;
  var n = group_value_list.length;
  var current_index = _via_image_grid_group_var[group_index].current_value_index;
  var prev_index = current_index - 1;
  if ( prev_index < 0 ) {
    if ( group_index === 0 ) {
      prev_index = n + prev_index;
      image_grid_jump_to_group(group_index, prev_index);
    } else {
      // prev of parent group
      var parent_group_index = group_index - 1;
      var parent_current_val_index = _via_image_grid_group_var[parent_group_index].current_value_index;
      var parent_prev_val_index = parent_current_val_index - 1;
      while ( parent_group_index !== 0 ) {
        if ( parent_prev_val_index < 0 ) {
          parent_group_index = group_index - 1;
          parent_current_val_index = _via_image_grid_group_var[parent_group_index].current_value_index;
          parent_prev_val_index = parent_current_val_index - 1;
        } else {
          break;
        }
      }

      if ( parent_prev_val_index < 0 ) {
        parent_prev_val_index = _via_image_grid_group_var[parent_group_index].values.length - 1;
      }
      image_grid_jump_to_group(parent_group_index, parent_prev_val_index);
    }
  } else {
    image_grid_jump_to_group(group_index, prev_index);
  }
  image_grid_set_content_to_current_group();
}


function image_grid_group_value_onchange(p) {
  var group_index = image_grid_group_select_parse_html_id(p.id);
  image_grid_jump_to_group(group_index, p.selectedIndex);
  image_grid_set_content_to_current_group();
}

function image_grid_jump_to_group(group_index, value_index) {
  var n = _via_image_grid_group_var[group_index].values.length;
  if ( value_index >=n || value_index < 0 ) {
    return;
  }

  _via_image_grid_group_var[group_index].current_value_index = value_index;
  image_grid_group_panel_set_selected_value( group_index );

  // reset the value of lower groups
  var i, value;
  if ( group_index + 1 < _via_image_grid_group_var.length ) {
    var e = _via_image_grid_group;
    for ( i = 0; i <= group_index; ++i ) {
      value = _via_image_grid_group_var[i].values[ _via_image_grid_group_var[i].current_value_index ];
      e = e[ value ];
    }

    for ( i = group_index + 1; i < _via_image_grid_group_var.length; ++i ) {
      _via_image_grid_group_var[i].values = Object.keys(e);
      if ( _via_image_grid_group_var[i].values.length === 0 ) {
        _via_image_grid_group_var[i].current_value_index = -1;
        _via_image_grid_group_var.splice(i);
        image_grid_group_panel_set_options(i);
        break;
      } else {
        _via_image_grid_group_var[i].current_value_index = 0;
        value = _via_image_grid_group_var[i].values[0]
        e = e[value];
        image_grid_group_panel_set_options(i);
      }
    }
  }
}

function image_grid_set_content_to_current_group() {
  var n = _via_image_grid_group_var.length;

  if ( n === 0 ) {
    image_grid_show_all_project_images();
  } else {
    var group_img_index_list = [];
    var img_index_list = _via_image_grid_group;
    var i, n, value, current_value_index;
    for ( i = 0; i < n; ++i ) {
      value = _via_image_grid_group_var[i].values[ _via_image_grid_group_var[i].current_value_index ];
      img_index_list = img_index_list[ value ];
    }

    if ( Array.isArray(img_index_list) ) {
      image_grid_set_content(img_index_list);
    } else {
      console.log('Error: image_grid_set_content_to_current_group(): expected array while got ' + typeof(img_index_list));
    }
  }
}

function image_grid_page_next() {
  _via_image_grid_stack_prev_page.push(_via_image_grid_page_first_index);
  _via_image_grid_page_first_index = _via_image_grid_page_last_index;

  image_grid_clear_content();
  _via_image_grid_load_ongoing = true;
  image_grid_page_nav_show_cancel();
  image_grid_content_append_img( _via_image_grid_page_first_index );
}

function image_grid_page_prev() {
  _via_image_grid_page_first_index = _via_image_grid_stack_prev_page.pop();
  _via_image_grid_page_last_index = -1;

  image_grid_clear_content();
  _via_image_grid_load_ongoing = true;
  image_grid_page_nav_show_cancel();
  image_grid_content_append_img( _via_image_grid_page_first_index );
}

function image_grid_page_nav_show_cancel() {
  var info = document.getElementById('image_grid_nav');
  var html = [];
  html.push('<span>Loading images ... </span>');
  html.push('<span class="text_button" onclick="image_grid_cancel_load_ongoing()">Cancel</span>');
  info.innerHTML = html.join('');
}

function image_grid_cancel_load_ongoing() {
  _via_image_grid_load_ongoing = false;
}


// everything to do with image zooming
function image_zoom_init() {

}

//
// hooks for sub-modules
// implemented by sub-modules
//
//function _via_hook_next_image() {}
//function _via_hook_prev_image() {}


////////////////////////////////////////////////////////////////////////////////
//
// Code borrowed from via2 branch
// - in future, the <canvas> based reigon shape drawing will be replaced by <svg>
//   because svg allows independent manipulation of individual regions without
//   requiring to clear the canvas every time some region is updated.
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//
// @file        _via_region.js
// @description Implementation of region shapes like rectangle, circle, etc.
// @author      Abhishek Dutta <adutta@robots.ox.ac.uk>
// @date        17 June 2017
//
////////////////////////////////////////////////////////////////////////////////

function _via_region( shape, id, data_img_space, view_scale_factor, view_offset_x, view_offset_y) {
  // Note the following terminology:
  //   view space  :
  //     - corresponds to the x-y plane on which the scaled version of original image is shown to the user
  //     - all the region query operations like is_inside(), is_on_edge(), etc are performed in view space
  //     - all svg draw operations like get_svg() are also in view space
  //
  //   image space :
  //     - corresponds to the x-y plane which corresponds to the spatial space of the original image
  //     - region save, export, git push operations are performed in image space
  //     - to avoid any rounding issues (caused by floating scale factor),
  //        * user drawn regions in view space is first converted to image space
  //        * this region in image space is now used to initialize region in view space
  //
  //   The two spaces are related by _via_model.now.tform.scale which is computed by the method
  //     _via_ctrl.compute_view_panel_to_nowfile_tform()
  //   and applied as follows:
  //     x coordinate in image space = scale_factor * x coordinate in view space
  //
  // shape : {rect, circle, ellipse, line, polyline, polygon, point}
  // id    : unique region-id
  // d[]   : (in view space) data whose meaning depend on region shape as follows:
  //        rect     : d[x1,y1,x2,y2] or d[corner1_x, corner1_y, corner2_x, corner2_y]
  //        circle   : d[x1,y1,x2,y2] or d[center_x, center_y, circumference_x, circumference_y]
  //        ellipse  : d[x1,y1,x2,y2,transform]
  //        line     : d[x1,y1,x2,y2]
  //        polyline : d[x1,y1,...,xn,yn]
  //        polygon  : d[x1,y1,...,xn,yn]
  //        point    : d[cx,cy]
  // scale_factor : for conversion from view space to image space
  //
  // Note: no svg data are stored with prefix "_". For example: _scale_factor, _x2
  this.shape  = shape;
  this.id     = id;
  this.scale_factor     = view_scale_factor;
  this.offset_x         = view_offset_x;
  this.offset_y         = view_offset_y;
  this.recompute_svg    = false;
  this.attributes  = {};

  var n = data_img_space.length;
  var i;
  this.dview  = new Array(n);
  this.dimg   = new Array(n);

  if ( n !== 0 ) {
    // IMPORTANT:
    // to avoid any rounding issues (caused by floating scale factor), we stick to
    // the principal that image space coordinates are the ground truth for every region.
    // Hence, we proceed as:
    //   * user drawn regions in view space is first converted to image space
    //   * this region in image space is now used to initialize region in view space
    for ( i = 0; i < n; i++ ) {
      this.dimg[i]  = data_img_space[i];

      var offset = this.offset_x;
      if ( i % 2 !== 0 ) {
        // y coordinate
        offset = this.offset_y;
      }
      this.dview[i] = Math.round( this.dimg[i] * this.scale_factor ) + offset;
    }
  }

  // set svg attributes for each shape
  switch( this.shape ) {
  case "rect":
    _via_region_rect.call( this );
    this.svg_attributes = ['x', 'y', 'width', 'height'];
    break;
  case "circle":
    _via_region_circle.call( this );
    this.svg_attributes = ['cx', 'cy', 'r'];
    break;
  case "ellipse":
    _via_region_ellipse.call( this );
    this.svg_attributes = ['cx', 'cy', 'rx', 'ry','transform'];
    break;
  case "line":
    _via_region_line.call( this );
    this.svg_attributes = ['x1', 'y1', 'x2', 'y2'];
    break;
  case "polyline":
    _via_region_polyline.call( this );
    this.svg_attributes = ['points'];
    break;
  case "polygon":
    _via_region_polygon.call( this );
    this.svg_attributes = ['points'];
    break;
  case "point":
    _via_region_point.call( this );
    // point is a special circle with minimal radius required for visualization
    this.shape = 'circle';
    this.svg_attributes = ['cx', 'cy', 'r'];
    break;
  }

  this.initialize();
}


_via_region.prototype.prepare_svg_element = function() {
  var _VIA_SVG_NS = "http://www.w3.org/2000/svg";
  this.svg_element = document.createElementNS(_VIA_SVG_NS, this.shape);
  this.svg_string  = '<' + this.shape;
  this.svg_element.setAttributeNS(null, 'id', this.id);

  var n = this.svg_attributes.length;
  for ( var i = 0; i < n; i++ ) {
    this.svg_element.setAttributeNS(null, this.svg_attributes[i], this[this.svg_attributes[i]]);
    this.svg_string += ' ' + this.svg_attributes[i] + '="' + this[this.svg_attributes[i]] + '"';
  }
  this.svg_string  += '/>';
}

_via_region.prototype.get_svg_element = function() {
  if ( this.recompute_svg ) {
    this.prepare_svg_element();
    this.recompute_svg = false;
  }
  return this.svg_element;
}

_via_region.prototype.get_svg_string = function() {
  if ( this.recompute_svg ) {
    this.prepare_svg_element();
    this.recompute_svg = false;
  }
  return this.svg_string;
}

///
/// Region shape : rectangle
///
function _via_region_rect() {
  this.is_inside  = _via_region_rect.prototype.is_inside;
  this.is_on_edge = _via_region_rect.prototype.is_on_edge;
  this.move  = _via_region_rect.prototype.move;
  this.resize  = _via_region_rect.prototype.resize;
  this.initialize = _via_region_rect.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_rect.prototype.dist_to_nearest_edge;
}

_via_region_rect.prototype.initialize = function() {
  // ensure that this.(x,y) corresponds to top-left corner of rectangle
  // Note: this.(x2,y2) is defined for convenience in calculations
  if ( this.dview[0] < this.dview[2] ) {
    this.x  = this.dview[0];
    this.x2 = this.dview[2];
  } else {
    this.x  = this.dview[2];
    this.x2 = this.dview[0];
  }
  if ( this.dview[1] < this.dview[3] ) {
    this.y  = this.dview[1];
    this.y2 = this.dview[3];
  } else {
    this.y  = this.dview[3];
    this.y2 = this.dview[1];
  }
  this.width  = this.x2 - this.x;
  this.height = this.y2 - this.y;
  this.recompute_svg = true;
}

///
/// Region shape : circle
///
function _via_region_circle() {
  this.is_inside  = _via_region_circle.prototype.is_inside;
  this.is_on_edge = _via_region_circle.prototype.is_on_edge;
  this.move       = _via_region_circle.prototype.move;
  this.resize     = _via_region_circle.prototype.resize;
  this.initialize = _via_region_circle.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_circle.prototype.dist_to_nearest_edge;
}

_via_region_circle.prototype.initialize = function() {
  this.cx = this.dview[0];
  this.cy = this.dview[1];
  var dx = this.dview[2] - this.dview[0];
  var dy = this.dview[3] - this.dview[1];
  this.r  = Math.round( Math.sqrt(dx * dx + dy * dy) );
  this.r2 = this.r * this.r;
  this.recompute_svg = true;
}


///
/// Region shape : ellipse
///
function _via_region_ellipse() {
  this.is_inside  = _via_region_ellipse.prototype.is_inside;
  this.is_on_edge = _via_region_ellipse.prototype.is_on_edge;
  this.move  = _via_region_ellipse.prototype.move;
  this.resize  = _via_region_ellipse.prototype.resize;
  this.initialize = _via_region_ellipse.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_ellipse.prototype.dist_to_nearest_edge;
}

_via_region_ellipse.prototype.initialize = function() {
  this.cx = this.dview[0];
  this.cy = this.dview[1];
  this.rx = Math.abs(this.dview[2] - this.dview[0]);
  this.ry = Math.abs(this.dview[3] - this.dview[1]);

  this.inv_rx2 = 1 / (this.rx * this.rx);
  this.inv_ry2 = 1 / (this.ry * this.ry);

  this.recompute_svg = true;
}



///
/// Region shape : line
///
function _via_region_line() {
  this.is_inside  = _via_region_line.prototype.is_inside;
  this.is_on_edge = _via_region_line.prototype.is_on_edge;
  this.move  = _via_region_line.prototype.move;
  this.resize  = _via_region_line.prototype.resize;
  this.initialize = _via_region_line.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_line.prototype.dist_to_nearest_edge;
}

_via_region_line.prototype.initialize = function() {
  this.x1 = this.dview[0];
  this.y1 = this.dview[1];
  this.x2 = this.dview[2];
  this.y2 = this.dview[3];
  this.dx = this.x1 - this.x2;
  this.dy = this.y1 - this.y2;
  this.mconst = (this.x1 * this.y2) - (this.x2 * this.y1);

  this.recompute_svg = true;
}


///
/// Region shape : polyline
///
function _via_region_polyline() {
  this.is_inside  = _via_region_polyline.prototype.is_inside;
  this.is_on_edge = _via_region_polyline.prototype.is_on_edge;
  this.move  = _via_region_polyline.prototype.move;
  this.resize  = _via_region_polyline.prototype.resize;
  this.initialize = _via_region_polyline.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_polyline.prototype.dist_to_nearest_edge;
}

_via_region_polyline.prototype.initialize = function() {
  var n = this.dview.length;
  var points = new Array(n/2);
  var points_index = 0;
  for ( var i = 0; i < n; i += 2 ) {
    points[points_index] = ( this.dview[i] + ' ' + this.dview[i+1] );
    points_index++;
  }
  this.points = points.join(',');
  this.recompute_svg = true;
}


///
/// Region shape : polygon
///
function _via_region_polygon() {
  this.is_inside  = _via_region_polygon.prototype.is_inside;
  this.is_on_edge = _via_region_polygon.prototype.is_on_edge;
  this.move  = _via_region_polygon.prototype.move;
  this.resize  = _via_region_polygon.prototype.resize;
  this.initialize = _via_region_polygon.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_polygon.prototype.dist_to_nearest_edge;
}

_via_region_polygon.prototype.initialize = function() {
  var n = this.dview.length;
  var points = new Array(n/2);
  var points_index = 0;
  for ( var i = 0; i < n; i += 2 ) {
    points[points_index] = ( this.dview[i] + ' ' + this.dview[i+1] );
    points_index++;
  }
  this.points = points.join(',');
  this.recompute_svg = true;
}


///
/// Region shape : point
///
function _via_region_point() {
  this.is_inside  = _via_region_point.prototype.is_inside;
  this.is_on_edge = _via_region_point.prototype.is_on_edge;
  this.move  = _via_region_point.prototype.move;
  this.resize  = _via_region_point.prototype.resize
  this.initialize  = _via_region_point.prototype.initialize;
  this.dist_to_nearest_edge = _via_region_point.prototype.dist_to_nearest_edge;
}

_via_region_point.prototype.initialize = function() {
  this.cx = this.dview[0];
  this.cy = this.dview[1];
  this.r  = 2;
  this.r2 = this.r * this.r;
  this.recompute_svg = true;
}

//
// image buffering
//

function _via_cancel_current_image_loading() {
  var panel = document.getElementById('project_panel_title');
  panel.innerHTML = 'Project';
  _via_is_loading_current_image = false;
}

function _via_show_img(img_index) {
  if ( _via_is_loading_current_image ) {
    return;
  }

  var img_id = _via_image_id_list[img_index];

  if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
    console.log('_via_show_img(): [' + img_index + '] ' + img_id + ' does not exist!')
    show_message('The requested image does not exist!')
    return;
  }

  // file_resolve() is not necessary for files selected using browser's file selector
  if ( typeof(_via_img_fileref[img_id]) === 'undefined' || ! _via_img_fileref[img_id] instanceof File ) {
    // try preload from local file or url
    if ( typeof(_via_img_src[img_id]) === 'undefined' || _via_img_src[img_id] === '' ) {
      if ( is_url( _via_img_metadata[img_id].filename ) ) {
        _via_img_src[img_id] = _via_img_metadata[img_id].filename;
        _via_show_img(img_index);
        return;
      } else {
        var search_path_list = _via_file_get_search_path_list();
        if ( search_path_list.length === 0 ) {
          search_path_list.push(''); // search using just the filename
        }

        _via_file_resolve(img_index, search_path_list).then( function(ok_file_index) {
          _via_show_img(img_index);
        }, function(err_file_index) {
          show_page_404(img_index);
        });
        return;
      }
    }
  }

  if ( _via_buffer_img_index_list.includes(img_index) ) {
    _via_current_image_loaded = false;
    _via_show_img_from_buffer(img_index).then( function(ok_img_index) {
      // trigger preload of images in buffer corresponding to img_index
      // but, wait until all previous promises get cancelled
      Promise.all(_via_preload_img_promise_list).then( function(values) {
        _via_preload_img_promise_list = [];
        var preload_promise = _via_img_buffer_start_preload( img_index, 0 )
        _via_preload_img_promise_list.push(preload_promise);
      });
    }, function(err_img_index) {
      console.log('_via_show_img_from_buffer() failed for file: ' + _via_image_filename_list[err_img_index]);
      _via_current_image_loaded = false;
    });
  } else {
    // image not in buffer, so first add this image to buffer
    _via_is_loading_current_image = true;
    img_loading_spinbar(img_index, true);
    _via_img_buffer_add_image(img_index).then( function(ok_img_index) {
      _via_is_loading_current_image = false;
      img_loading_spinbar(img_index, false);
      _via_show_img(img_index);
    }, function(err_img_index) {
      _via_is_loading_current_image = false;
      img_loading_spinbar(img_index, false);
      show_page_404(img_index);
      console.log('_via_img_buffer_add_image() failed for file: ' + _via_image_filename_list[err_img_index]);
    });
  }
}

function _via_buffer_hide_current_image() {
  img_fn_list_ith_entry_selected(_via_image_index, false);
  _via_clear_reg_canvas(); // clear old region shapes
  if ( _via_current_image ) {
    _via_current_image.classList.remove('visible');
  }
}

function _via_show_img_from_buffer(img_index) {
  return new Promise( function(ok_callback, err_callback) {
    _via_buffer_hide_current_image();

    var cimg_html_id = _via_img_buffer_get_html_id(img_index);
    _via_current_image = document.getElementById(cimg_html_id);
    if ( ! _via_current_image ) {
      // the said image is not present in buffer, which could be because
      // the image got removed from the buffer
      err_callback(img_index);
      return;
    }
    _via_current_image.classList.add('visible'); // now show the new image

    _via_image_index = img_index;
    _via_image_id    = _via_image_id_list[_via_image_index];
    _via_current_image_filename = _via_img_metadata[_via_image_id].filename;
    _via_current_image_loaded = true;

    var arr_index = _via_buffer_img_index_list.indexOf(img_index);
    _via_buffer_img_shown_timestamp[arr_index] = Date.now(); // update shown timestamp

    // update the current state of application
    _via_click_x0 = 0; _via_click_y0 = 0;
    _via_click_x1 = 0; _via_click_y1 = 0;
    _via_is_user_drawing_region = false;
    _via_is_window_resized = false;
    _via_is_user_resizing_region = false;
    _via_is_user_moving_region = false;
    _via_is_user_drawing_polygon = false;
    _via_is_region_selected = false;
    _via_user_sel_region_id = -1;
    _via_current_image_width = _via_current_image.naturalWidth;
    _via_current_image_height = _via_current_image.naturalHeight;

    if ( _via_current_image_width === 0 || _via_current_image_height === 0 ) {
      // for error image icon
      _via_current_image_width = 640;
      _via_current_image_height = 480;
    }

    // set the size of canvas
    // based on the current dimension of browser window
    var de = document.documentElement;
    var image_panel_width = de.clientWidth - leftsidebar.clientWidth - 20;
    if ( leftsidebar.style.display === 'none' ) {
      image_panel_width = de.clientWidth;
    }
    var image_panel_height = de.clientHeight - 2*ui_top_panel.offsetHeight;

    _via_canvas_width = _via_current_image_width;
    _via_canvas_height = _via_current_image_height;

    if ( _via_canvas_width > image_panel_width ) {
      // resize image to match the panel width
      var scale_width = image_panel_width / _via_current_image.naturalWidth;
      _via_canvas_width = image_panel_width;
      _via_canvas_height = _via_current_image.naturalHeight * scale_width;
    }
    if ( _via_canvas_height > image_panel_height ) {
      // resize further image if its height is larger than the image panel
      var scale_height = image_panel_height / _via_canvas_height;
      _via_canvas_height = image_panel_height;
      _via_canvas_width = _via_canvas_width * scale_height;
    }
    _via_canvas_width = Math.round(_via_canvas_width);
    _via_canvas_height = Math.round(_via_canvas_height);
    _via_canvas_scale = _via_current_image.naturalWidth / _via_canvas_width;
    _via_canvas_scale_without_zoom = _via_canvas_scale;
    set_all_canvas_size(_via_canvas_width, _via_canvas_height);
    //set_all_canvas_scale(_via_canvas_scale_without_zoom);

    // reset all regions to "not selected" state
    toggle_all_regions_selection(false);

    // ensure that all the canvas are visible
    set_display_area_content( VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE );

    // update img_fn_list
    img_fn_list_ith_entry_selected(_via_image_index, true);
    img_fn_list_scroll_to_current_file();

    // refresh the annotations panel
    annotation_editor_update_content();

    _via_load_canvas_regions(); // image to canvas space transform
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();

    // Preserve zoom level
    if (_via_is_canvas_zoomed) {
      set_zoom( _via_canvas_zoom_level_index );
    }
    ok_callback(img_index);
  });
}

function _via_img_buffer_add_image(img_index) {
  return new Promise( function(ok_callback, err_callback) {
    if ( _via_buffer_img_index_list.includes(img_index) ) {
      //console.log('_via_img_buffer_add_image(): image ' + img_index + ' already exists in buffer!')
      ok_callback(img_index);
      return;
    }

    var img_id = _via_image_id_list[img_index];
    var img_filename = _via_img_metadata[img_id].filename;
    if ( !_via_img_metadata.hasOwnProperty(img_id)) {
      err_callback(img_index);
      return;
    }

    // check if user has given access to local file using
    // browser's file selector
    if ( _via_img_fileref[img_id] instanceof File ) {
      var tmp_file_object_url = URL.createObjectURL(_via_img_fileref[img_id]);
      var img_id = _via_image_id_list[img_index];
      var bimg = document.createElement('img');
      bimg.setAttribute('id', _via_img_buffer_get_html_id(img_index));
      bimg.setAttribute('src', tmp_file_object_url);
      bimg.setAttribute('alt', 'Image loaded from base64 data of a local file selected by user.');
      bimg.addEventListener('error', function() {
        URL.revokeObjectURL(tmp_file_object_url);
        project_file_load_on_fail(img_index);
        err_callback(img_index);
      });
      bimg.addEventListener('load', function() {
        URL.revokeObjectURL(tmp_file_object_url);
        img_stat_set(img_index, [bimg.naturalWidth, bimg.naturalHeight]);
        _via_img_panel.insertBefore(bimg, _via_reg_canvas);
        project_file_load_on_success(img_index);
        img_fn_list_ith_entry_add_css_class(img_index, 'buffered')
        // add timestamp so that we can apply Least Recently Used (LRU)
        // scheme to remove elements when buffer is full
        var arr_index = _via_buffer_img_index_list.length;
        _via_buffer_img_index_list.push(img_index);
        _via_buffer_img_shown_timestamp[arr_index] = Date.now(); // though, not seen yet
        ok_callback(img_index);
      });
      return;
    }

    if ( typeof(_via_img_src[img_id]) === 'undefined' || _via_img_src[img_id] === '' ) {
      err_callback(img_index);
    } else {
      var img_id = _via_image_id_list[img_index];

      var bimg = document.createElement('img');
      bimg.setAttribute('id', _via_img_buffer_get_html_id(img_index));
      _via_img_src[img_id] = _via_img_src[img_id].replace('#', '%23');
      bimg.setAttribute('src', _via_img_src[img_id]);
      if ( _via_img_src[img_id].startsWith('data:image') ) {
        bimg.setAttribute('alt', 'Source: image data in base64 format');
      } else {
        bimg.setAttribute('alt', 'Source: ' + _via_img_src[img_id]);
      }

      bimg.addEventListener('abort', function() {
        project_file_load_on_fail(img_index);
        err_callback(img_index);
      });
      bimg.addEventListener('error', function() {
        project_file_load_on_fail(img_index);
        err_callback(img_index);
      });

      // Note: _via_current_image.{naturalWidth,naturalHeight} is only accessible after
      // the "load" event. Therefore, all processing must happen inside this event handler.
      bimg.addEventListener('load', function() {
        img_stat_set(img_index, [bimg.naturalWidth, bimg.naturalHeight]);
        _via_img_panel.insertBefore(bimg, _via_reg_canvas);

        project_file_load_on_success(img_index);
        img_fn_list_ith_entry_add_css_class(img_index, 'buffered')
        // add timestamp so that we can apply Least Recently Used (LRU)
        // scheme to remove elements when buffer is full
        var arr_index = _via_buffer_img_index_list.length;
        _via_buffer_img_index_list.push(img_index);
        _via_buffer_img_shown_timestamp[arr_index] = Date.now(); // though, not seen yet
        ok_callback(img_index);
      }, false);
    }
  }, false);
}

function _via_img_buffer_get_html_id(img_index) {
  return 'bim' + img_index;
}

function _via_img_buffer_parse_html_id(html_id) {
  return parseInt( html_id.substr(3) );
}

function _via_img_buffer_start_preload(img_index, preload_index) {
  return new Promise( function(ok_callback, err_callback) {
    _via_buffer_preload_img_index = img_index;
    _via_img_buffer_preload_img(_via_buffer_preload_img_index, 0).then( function(ok_img_index_list) {
      ok_callback(ok_img_index_list);
    });
  });
}

function _via_img_buffer_preload_img(img_index, preload_index) {
  return new Promise( function(ok_callback, err_callback) {
    var preload_img_index = _via_img_buffer_get_preload_img_index(img_index, preload_index);

    if ( _via_buffer_preload_img_index !== _via_image_index ) {
      ok_callback([]);
      return;
    }

    // ensure that there is sufficient buffer space left for preloading image
    if ( _via_buffer_img_index_list.length > _via_settings.core.buffer_size ) {
      while( _via_buffer_img_index_list.length > _via_settings.core.buffer_size ) {
        _via_img_buffer_remove_least_useful_img();
        if ( _via_image_index !== _via_buffer_preload_img_index ) {
          // current image has changed therefore, we need to cancel this preload operation
          ok_callback([]);
          return;
        }
      }
    }

    _via_img_buffer_add_image(preload_img_index).then( function(ok_img_index) {
      if ( _via_image_index !== _via_buffer_preload_img_index ) {
        ok_callback( [ok_img_index] );
        return;
      }

      var next_preload_index = preload_index + 1;
      if ( next_preload_index !== VIA_IMG_PRELOAD_COUNT ) {
        _via_img_buffer_preload_img(img_index, next_preload_index).then( function(ok_img_index_list) {
          ok_img_index_list.push( ok_img_index )
          ok_callback( ok_img_index_list );
        });
      } else {
        ok_callback( [ok_img_index] );
      }
    }, function(err_img_index) {
      // continue with preload of other images in sequence
      var next_preload_index = preload_index + 1;
      if ( next_preload_index !== VIA_IMG_PRELOAD_COUNT ) {
        _via_img_buffer_preload_img(img_index, next_preload_index).then( function(ok_img_index_list) {
          ok_callback( ok_img_index_list );
        });
      } else {
        ok_callback([]);
      }
    });
  });
}

function _via_img_buffer_get_preload_img_index(img_index, preload_index) {
  var preload_img_index = img_index + VIA_IMG_PRELOAD_INDICES[preload_index];
  if ( (preload_img_index < 0) || (preload_img_index >= _via_img_count) ) {
    if ( preload_img_index < 0 ) {
      preload_img_index = _via_img_count + preload_img_index;
    } else {
      preload_img_index = preload_img_index - _via_img_count;
    }
  }
  return preload_img_index;
}

// the least useful image is, one with the following properties:
// - preload list for current image will always get loaded, so there is no point in removing them from buffer
// - all the other images in buffer were seen more recently by the image
// - all the other images are closer (in terms of their image index) to the image currently being shown
function _via_img_buffer_remove_least_useful_img() {
  var not_in_preload_list = _via_buffer_img_not_in_preload_list();
  var oldest_buffer_index = _via_buffer_get_oldest_in_list(not_in_preload_list);

  if ( _via_buffer_img_index_list[oldest_buffer_index] !== _via_image_index ) {
    //console.log('removing oldest_buffer index: ' + oldest_buffer_index);
    _via_buffer_remove(oldest_buffer_index);
  } else {
    var furthest_buffer_index = _via_buffer_get_buffer_furthest_from_current_img();
    _via_buffer_remove(furthest_buffer_index);
  }
}

function _via_buffer_remove( buffer_index ) {
  var img_index = _via_buffer_img_index_list[buffer_index];
  var bimg_html_id = _via_img_buffer_get_html_id(img_index);
  var bimg = document.getElementById(bimg_html_id);
  if ( bimg ) {
    _via_buffer_img_index_list.splice(buffer_index, 1);
    _via_buffer_img_shown_timestamp.splice(buffer_index, 1);
    _via_img_panel.removeChild(bimg);

    img_fn_list_ith_entry_remove_css_class(img_index, 'buffered')
  }
}

function _via_buffer_remove_all() {
  var i, n;
  n = _via_buffer_img_index_list.length;
  for ( i = 0 ; i < n; ++i ) {
    var img_index = _via_buffer_img_index_list[i];
    var bimg_html_id = _via_img_buffer_get_html_id(img_index);
    var bimg = document.getElementById(bimg_html_id);
    if ( bimg ) {
      _via_img_panel.removeChild(bimg);
    }
  }
  _via_buffer_img_index_list = [];
  _via_buffer_img_shown_timestamp = [];
}

function _via_buffer_get_oldest_in_list(not_in_preload_list) {
  var i;
  var n = not_in_preload_list.length;
  var oldest_buffer_index = -1;
  var oldest_buffer_timestamp = Date.now();

  for ( i = 0; i < n; ++i ) {
    var _via_buffer_index = not_in_preload_list[i];
    if ( _via_buffer_img_shown_timestamp[_via_buffer_index] < oldest_buffer_timestamp ) {
      oldest_buffer_timestamp = _via_buffer_img_shown_timestamp[i];
      oldest_buffer_index = i;
    }
  }
  return oldest_buffer_index;
}

function _via_buffer_get_buffer_furthest_from_current_img() {
  var now_img_index = _via_image_index;
  var i, dist1, dist2, dist;
  var n = _via_buffer_img_index_list.length;
  var furthest_buffer_index = 0;
  dist1 = Math.abs( _via_buffer_img_index_list[0] - now_img_index );
  dist2 = _via_img_count - dist1; // assuming the list is circular
  var furthest_buffer_dist = Math.min(dist1, dist2);

  for ( i = 1; i < n; ++i ) {
    dist1 = Math.abs( _via_buffer_img_index_list[i] - now_img_index );
    dist2 = _via_img_count - dist1; // assuming the list is circular
    dist = Math.min(dist1, dist2);
    // image has been seen by user at least once
    if ( dist > furthest_buffer_dist ) {
      furthest_buffer_dist = dist;
      furthest_buffer_index = i;
    }
  }
  return furthest_buffer_index;
}

function _via_buffer_img_not_in_preload_list() {
  var preload_list = _via_buffer_get_current_preload_list();
  var i;
  var not_in_preload_list = [];
  for ( i = 0; i < _via_buffer_img_index_list.length; ++i ) {
    if ( ! preload_list.includes( _via_buffer_img_index_list[i] ) ) {
      not_in_preload_list.push( i );
    }
  }
  return not_in_preload_list;
}

function _via_buffer_get_current_preload_list() {
  var i;
  var preload_list = [_via_image_index];
  var img_index = _via_image_index;
  for ( i = 0; i < VIA_IMG_PRELOAD_COUNT; ++i ) {
    var preload_index = img_index + VIA_IMG_PRELOAD_INDICES[i];
    if ( preload_index < 0 ) {
      preload_index = _via_img_count + preload_index;
    }
    if ( preload_index >= _via_img_count ) {
      preload_index = preload_index - _via_img_count;
    }
    preload_list.push(preload_index);
  }
  return preload_list;
}

//
// settings
//
function settings_panel_toggle() {
  if ( _via_display_area_content_name === VIA_DISPLAY_AREA_CONTENT_NAME.SETTINGS ) {
    if ( _via_display_area_content_name_prev !== '' ) {
      set_display_area_content(_via_display_area_content_name_prev);
    } else {
      show_single_image_view();
      _via_redraw_rleg_canvas();
    }
  }
  else {
    settings_init();
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.SETTINGS);
  }
}

function settings_init() {
  settings_region_visualisation_update_options();
  settings_filepath_update_html();
  settings_show_current_value();
}

function settings_save() {
  // check if default path was updated
  var default_path_updated = false;
  if ( document.getElementById('_via_settings.core.default_filepath').value !== _via_settings.core.default_filepath ) {
    default_path_updated = true;
  }

  var p = document.getElementById('settings_panel');
  var vl = p.getElementsByClassName('value');
  var n = vl.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    var s = vl[i].childNodes[1];
    var sid_parts = s.id.split('.');
    if ( sid_parts[0] === '_via_settings' ) {
      var el = _via_settings;
      var found = true;
      var j;
      for ( j = 1; j < sid_parts.length - 1; ++j ) {
        if ( el.hasOwnProperty( sid_parts[j] ) ) {
          el = el[ sid_parts[j] ];
        } else {
          // unrecognized setting
          found = false;
          break;
        }
      }
      if ( found ) {
        var param = sid_parts[ sid_parts.length - 1 ];
        if ( s.value !== '' || typeof(s.value) !== 'undefined' ) {
          el[param] = s.value;
        }
      }
    }
  }

  // non-standard settings
  var p;
  p = document.getElementById('settings_input_new_filepath');
  if ( p.value !== '' ) {
    project_filepath_add(p.value.trim());
  }
  p = document.getElementById('project_name');
  if ( p.value !== _via_settings.project.name ) {
    p.value = _via_settings.project.name;
  }

  if ( default_path_updated ) {
    _via_file_resolve_all_to_default_filepath();
    _via_show_img(_via_image_index);
  }

  show_message('Settings saved.');
  settings_panel_toggle();
}

function settings_show_current_value() {
  var p = document.getElementById('settings_panel');
  var vl = p.getElementsByClassName('value');
  var n = vl.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    var s = vl[i].childNodes[1];
    var sid_parts = s.id.split('.');
    if ( sid_parts[0] === '_via_settings' ) {
      var el = _via_settings;
      var found = true;
      var j;
      for ( j = 1; j < sid_parts.length; ++j ) {
        if ( el.hasOwnProperty( sid_parts[j] ) ) {
          el = el[ sid_parts[j] ];
        } else {
          // unrecognized setting
          found = false;
          break;
        }
      }

      if ( found ) {
        s.value = el;
      }
    }
  }
}

function settings_region_visualisation_update_options() {
  var region_setting_list = {'region_label': {
    'default_option':'__via_region_id__',
    'default_label':'Region id (1, 2, ...)',
    'label_prefix':'Show value of region attribute: ',
  }, 'region_color': {
    'default_option':'__via_default_region_color__',
    'default_label':'Default Region Colour',
    'label_prefix':'Based on value of region attribute: ',
  }};

  for ( var setting in region_setting_list ) {
    var select = document.getElementById('_via_settings.ui.image.' + setting);
    select.innerHTML = '';
    var default_option = document.createElement('option');
    default_option.setAttribute('value', region_setting_list[setting]['default_option']);
    if ( _via_settings.ui.image[setting] === region_setting_list[setting]['default_option'] ) {
      default_option.setAttribute('selected', 'selected');
    }
    default_option.innerHTML = region_setting_list[setting]['default_label'];
    select.appendChild(default_option);

    // options: add region attributes
    var rattr;
    for ( rattr in _via_attributes['region'] ) {
      var o = document.createElement('option');
      o.setAttribute('value', rattr);
      o.innerHTML = region_setting_list[setting]['label_prefix'] + rattr;
      if ( _via_settings.ui.image.region_label === rattr ) {
        o.setAttribute('selected', 'selected');
      }
      select.appendChild(o);
    }
  }
}

function settings_filepath_update_html() {
  var p = document.getElementById('_via_settings.core.filepath');
  p.innerHTML = '';
  var i, path, order;
  for ( path in _via_settings.core.filepath ) {
    order = _via_settings.core.filepath[path]
    if ( order !== 0 ) {
      var li = document.createElement('li');
      li.innerHTML = path + '<span class="text_button" title="Delete image path" onclick="project_filepath_del(\"' + path + '\"); settings_filepath_update_html();">&times;</span>';
      p.appendChild(li);
    }
  }
}

//
// find location of file
//

function _via_file_resolve_all_to_default_filepath() {
  var img_id;
  for ( img_id in _via_img_metadata ) {
    if ( _via_img_metadata.hasOwnProperty(img_id) ) {
      _via_file_resolve_file_to_default_filepath(img_id);
    }
  }
}

function _via_file_resolve_file_to_default_filepath(img_id) {
  if ( _via_img_metadata.hasOwnProperty(img_id) ) {
    if ( typeof(_via_img_fileref[img_id]) === 'undefined' || ! _via_img_fileref[img_id] instanceof File ) {
      if ( is_url( _via_img_metadata[img_id].filename ) ) {
        _via_img_src[img_id] = _via_img_metadata[img_id].filename;
      } else {
        _via_img_src[img_id] = _via_settings.core.default_filepath + _via_img_metadata[img_id].filename;
      }
    }
  }
}

function _via_file_resolve_all() {
  return new Promise( function(ok_callback, err_callback) {
    var all_promises = [];

    var search_path_list = _via_file_get_search_path_list();
    var i, img_id;
    for ( i = 0; i < _via_img_count; ++i ) {
      img_id = _via_image_id_list[i];
      if ( typeof(_via_img_src[img_id]) === 'undefined' || _via_img_src[img_id] === '' ) {
        var p = _via_file_resolve(i, search_path_list);
        all_promises.push(p);
      }
    }

    Promise.all( all_promises ).then( function(ok_file_index_list) {
      console.log(ok_file_index_list);
      ok_callback();
      //project_file_load_on_success(ok_file_index);
    }, function(err_file_index_list) {
      console.log(err_file_index_list);
      err_callback();
      //project_file_load_on_fail(err_file_index);
    });

  });
}

function _via_file_get_search_path_list() {
  var search_path_list = [];
  var path;
  for ( path in _via_settings.core.filepath ) {
    if ( _via_settings.core.filepath[path] !== 0 ) {
      search_path_list.push(path);
    }
  }
  return search_path_list;
}

function _via_file_resolve(file_index, search_path_list) {
  return new Promise( function(ok_callback, err_callback) {
    var path_index = 0;
    var p = _via_file_resolve_check_path(file_index, path_index, search_path_list).then(function(ok) {
      ok_callback(ok);
    }, function(err) {
      err_callback(err);
    });
  }, false);
}

function _via_file_resolve_check_path(file_index, path_index, search_path_list) {
  return new Promise( function(ok_callback, err_callback) {
    var img_id = _via_image_id_list[file_index];
    var img = new Image(0,0);

    var img_path = search_path_list[path_index] + _via_img_metadata[img_id].filename;
    if ( is_url( _via_img_metadata[img_id].filename ) ) {
      if ( search_path_list[path_index] !== '' ) {
        // we search for the the image filename pointed by URL in local search paths
        img_path = search_path_list[path_index] + get_filename_from_url( _via_img_metadata[img_id].filename );
      }
    }

    img.setAttribute('src', img_path);

    img.addEventListener('load', function() {
      _via_img_src[img_id] = img_path;
      ok_callback(file_index);
    }, false);
    img.addEventListener('abort', function() {
      err_callback(file_index);
    });
    img.addEventListener('error', function() {
      var new_path_index = path_index + 1;
      if ( new_path_index < search_path_list.length ) {
        _via_file_resolve_check_path(file_index, new_path_index, search_path_list).then( function(ok) {
          ok_callback(file_index);
        }, function(err) {
          err_callback(file_index);
        });
      } else {
        err_callback(file_index);
      }
    }, false);
  }, false);
}

//
// page 404 (file not found)
//
function show_page_404(img_index) {
  _via_buffer_hide_current_image();

  set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_404);

  _via_image_index = img_index;
  _via_image_id = _via_image_id_list[_via_image_index];
  _via_current_image_loaded = false;
  img_fn_list_ith_entry_selected(_via_image_index, true);

  document.getElementById('page_404_filename').innerHTML = '[' + (_via_image_index+1) + ']' + _via_img_metadata[_via_image_id].filename;
}


//
// utils
//

function is_url( s ) {
  // @todo: ensure that this is sufficient to capture all image url
  if ( s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.') ) {
    return true;
  } else {
    return false;
  }
}

function get_filename_from_url( url ) {
  return url.substring( url.lastIndexOf('/') + 1 );
}

function fixfloat(x) {
  return parseFloat( x.toFixed(VIA_FLOAT_PRECISION) );
}

function shape_attribute_fixfloat(sa) {
  for ( var attr in sa ) {
    switch(attr) {
    case 'x':
    case 'y':
    case 'width':
    case 'height':
    case 'r':
    case 'rx':
    case 'ry':
      sa[attr] = fixfloat( sa[attr] );
      break;
    case 'all_points_x':
    case 'all_points_y':
      for ( var i in sa[attr] ) {
        sa[attr][i] = fixfloat( sa[attr][i] );
      }
    }
  }
}

// start with the array having smallest number of elements
// check the remaining arrays if they all contain the elements of this shortest array
function array_intersect( array_list ) {
  if ( array_list.length === 0 ) {
    return [];
  }
  if ( array_list.length === 1 ) {
    return array_list[0];
  }

  var shortest_array = array_list[0];
  var shortest_array_index = 0;
  var i;
  for ( i = 1; i < array_list.length; ++i ) {
    if ( array_list[i].length < shortest_array.length ) {
      shortest_array = array_list[i];
      shortest_array_index = i;
    }
  }

  var intersect = [];
  var element_count = {};

  var array_index_i;
  for ( i = 0; i < array_list.length; ++i ) {
    if ( i === 0 ) {
      // in the first iteration, process the shortest element array
      array_index_i = shortest_array_index;
    } else {
      array_index_i = i;
    }

    var j;
    for ( j = 0; j < array_list[array_index_i].length; ++j ) {
      if ( element_count[ array_list[array_index_i][j] ] === (i-1) ) {
        if ( i === array_list.length - 1 ) {
          intersect.push( array_list[array_index_i][j] );
          element_count[ array_list[array_index_i][j] ] = 0;
        } else {
          element_count[ array_list[array_index_i][j] ] = i;
        }
      } else {
        element_count[ array_list[array_index_i][j] ] = 0;
      }
    }
  }
  return intersect;
}

function generate_img_index_list(input) {
  var all_img_index_list = [];

  // condition: count format a,b
  var count_format_img_index_list = [];
  if ( input.prev_next_count.value !== '' ) {
    var prev_next_split = input.prev_next_count.value.split(',');
    if ( prev_next_split.length === 2 ) {
      var prev = parseInt( prev_next_split[0] );
      var next = parseInt( prev_next_split[1] );
      var i;
      for ( i = (_via_image_index - prev); i <= (_via_image_index + next); i++ ) {
        count_format_img_index_list.push(i);
      }
    }
  }
  if ( count_format_img_index_list.length !== 0 ) {
    all_img_index_list.push(count_format_img_index_list);
  }

  //condition: image index list expression
  var expr_img_index_list = [];
  if ( input.img_index_list.value !== '' ) {
    var img_index_expr = input.img_index_list.value.split(',');
    if ( img_index_expr.length !== 0 ) {
      var i;
      for ( i = 0; i < img_index_expr.length; ++i ) {
        if ( img_index_expr[i].includes('-') ) {
          var ab = img_index_expr[i].split('-');
          var a = parseInt( ab[0] ) - 1; // 0 based indexing
          var b = parseInt( ab[1] ) - 1;
          var j;
          for ( j = a; j <= b; ++j ) {
            expr_img_index_list.push(j);
          }
        } else {
          expr_img_index_list.push( parseInt(img_index_expr[i]) - 1 );
        }
      }
    }
  }
  if ( expr_img_index_list.length !== 0 ) {
    all_img_index_list.push(expr_img_index_list);
  }


  // condition: regular expression
  var regex_img_index_list = [];
  if ( input.regex.value !== '' ) {
    var regex = input.regex.value;
    for ( var i=0; i < _via_image_filename_list.length; ++i ) {
      var filename = _via_image_filename_list[i];
      if ( filename.match(regex) !== null ) {
        regex_img_index_list.push(i);
      }
    }
  }
  if ( regex_img_index_list.length !== 0 ) {
    all_img_index_list.push(regex_img_index_list);
  }

  var intersect = array_intersect(all_img_index_list);
  return intersect;
}

if ( ! _via_is_debug_mode ) {
  // warn user of possible loss of data
  window.onbeforeunload = function (e) {
    e = e || window.event;

    // For IE and Firefox prior to version 4
    if (e) {
      e.returnValue = 'Did you save your data?';
    }

    // For Safari
    return 'Did you save your data?';
  };
}

//
// keep a record of image statistics (e.g. width, height, ...)
//
function img_stat_set(img_index, stat) {
  if ( stat.length ) {
    _via_img_stat[img_index] = stat;
  } else {
    delete _via_img_stat[img_index];
  }
}

function img_stat_set_all() {
  return new Promise( function(ok_callback, err_callback) {
    var promise_list = [];
    var img_id;
    for ( var img_index in _via_image_id_list ) {
      if ( ! _via_img_stat.hasOwnProperty(img_index) ) {
        img_id = _via_image_id_list[img_index];
        if ( _via_img_metadata[img_id].file_attributes.hasOwnProperty('width') &&
             _via_img_metadata[img_id].file_attributes.hasOwnProperty('height')
           ) {
          _via_img_stat[img_index] = [_via_img_metadata[img_id].file_attributes['width'],
                                      _via_img_metadata[img_id].file_attributes['height'],
                                     ];
        } else {
          promise_list.push( img_stat_get(img_index) );
        }
      }
    }
    if ( promise_list.length ) {
      Promise.all(promise_list).then( function(ok) {
        ok_callback();
      }.bind(this), function(err) {
        console.warn('Failed to read statistics of all images!');
        err_callback();
      });
    } else {
      ok_callback();
    }
  }.bind(this));
}

function img_stat_get(img_index) {
  return new Promise( function(ok_callback, err_callback) {
    var img_id = _via_image_id_list[img_index];
    var tmp_img = document.createElement('img');
    var tmp_file_object_url = null;
    tmp_img.addEventListener('load', function() {
      _via_img_stat[img_index] = [tmp_img.naturalWidth, tmp_img.naturalHeight];
      if ( tmp_file_object_url !== null ) {
        URL.revokeObjectURL(tmp_file_object_url);
      }
      ok_callback();
    }.bind(this));
    tmp_img.addEventListener('error', function() {
      _via_img_stat[img_index] = [-1, -1];
      if ( tmp_file_object_url !== null ) {
        URL.revokeObjectURL(tmp_file_object_url);
      }
      ok_callback();
    }.bind(this));

    if ( _via_img_fileref[img_id] instanceof File ) {
      tmp_file_object_url = URL.createObjectURL(_via_img_fileref[img_id]);
      tmp_img.src = tmp_file_object_url;
    } else {
      tmp_img.src = _via_img_src[img_id];
    }
  }.bind(this));
}


// pts = [x0,y0,x1,y1,....]
function polygon_to_bbox(pts) {
  var xmin = +Infinity;
  var xmax = -Infinity;
  var ymin = +Infinity;
  var ymax = -Infinity;
  for ( var i = 0; i < pts.length; i = i + 2 ) {
    if ( pts[i] > xmax ) {
      xmax = pts[i];
    }
    if ( pts[i] < xmin ) {
      xmin = pts[i];
    }
    if ( pts[i+1] > ymax ) {
      ymax = pts[i+1];
    }
    if ( pts[i+1] < ymin ) {
      ymin = pts[i+1];
    }
  }
  return [xmin, ymin, xmax-xmin, ymax-ymin];
}


let classesUnique = [];

function openAddModalUnique() {
  document.getElementById("addModalUnique").style.display = "flex";
}

function openModifyModalUnique() {
  const modifyList = document.getElementById("modifyClassListUnique");
  modifyList.innerHTML = "";

  if (classesUnique.length === 0) {
    alert("No classes available to modify.");
    return;
  }

  classesUnique.forEach((classItem, index) => {
    const div = document.createElement("div");
    div.className = "modify-row-unique";
    div.innerHTML = `
      <input type="text" class="modify-input-unique" value="${classItem.name}" oninput="updateClassNameUnique(${index}, this.value)">
      <button class="modern-delete-unique" onclick="deleteClassUnique(${index})">Delete</button>
    `;
    modifyList.appendChild(div);
  });

  document.getElementById("modifyModalUnique").style.display = "flex";
}

function closeModalUnique(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function addClassUnique() {
  const input = document.getElementById("newClassInputUnique");
  const className = input.value.trim();
  if (!className) return;

  classesUnique.push({ name: className, count: 0 });

  updateClassListUnique();
  updateAttributesDropdown(); // Ensure dropdown is updated
  const dropdown = document.getElementById("attributes_name_list");
  const option = document.createElement("option");
  option.value = className;
  option.textContent = className;
  dropdown.appendChild(option);

  input.value = "";
  closeModalUnique("addModalUnique");
}

function updateAttributesDropdown() {
  const dropdown = document.getElementById("attributes_name_list");
  dropdown.innerHTML = ""; // Clear existing options

  classesUnique.forEach((classItem) => {
    const option = document.createElement("option");
    option.value = classItem.name;
    option.textContent = classItem.name;
    dropdown.appendChild(option);
  });
}

function updateClassNameUnique(index, newName) {
  classesUnique[index].name = newName;
}

function deleteClassUnique(index) {
  const removedClass = classesUnique.splice(index, 1)[0];
  updateClassListUnique();

  // Remove the corresponding option from the dropdown
  const dropdown = document.getElementById("attributes_name_list");
  for (let i = 0; i < dropdown.options.length; i++) {
    if (dropdown.options[i].value === removedClass.name) {
      dropdown.remove(i);
      break;
    }
  }

  closeModalUnique("modifyModalUnique"); // Close modal after deletion
}

function saveChangesUnique() {
  updateClassListUnique();
  closeModalUnique("modifyModalUnique");
}

function updateClassListUnique() {
  const classList = document.getElementById("classListUnique");
  classList.innerHTML = "";

  classesUnique.forEach((classItem) => {
    const classElement = document.createElement("div");
    classElement.className = "class-item-unique";
    classElement.innerHTML = `
      <span class="class-name-unique">${classItem.name}</span>
      <span class="class-details-unique">${classItem.count || 0}</span>
    `;
    classList.appendChild(classElement);
  });
}

function updateClassListUnique() {
  const classList = document.getElementById("classListUnique");
  classList.innerHTML = "";

  if (classesUnique.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "class-item-unique";
    placeholder.id = "placeholderClass";
    placeholder.innerHTML = `
      <span class="class-name-unique">No Class</span>
      <span class="class-details-unique">0</span>
    `;
    classList.appendChild(placeholder);
    return;
  }

  classesUnique.forEach((classItem) => {
    const classElement = document.createElement("div");
    classElement.className = "class-item-unique";
    classElement.innerHTML = `
      <span class="class-name-unique">${classItem.name}</span>
      <span class="class-details-unique">${classItem.count || 0}</span>
    `;
    classList.appendChild(classElement);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const titleElement = document.getElementById("projectTitle");

  // Load saved title from local storage if it exists
  const savedTitle = localStorage.getItem("projectTitle");
  if (savedTitle) {
      titleElement.textContent = savedTitle;
  }

  // Make the title editable on click
  titleElement.addEventListener("click", function () {
      const newTitle = prompt("Enter new project title:", titleElement.textContent);
      if (newTitle !== null && newTitle.trim() !== "") {
          titleElement.textContent = newTitle;
          localStorage.setItem("projectTitle", newTitle); // Save title to local storage
      }
  });
});
function leftsidebar_toggle() {
  var leftSidebar = document.getElementById('leftsidebar');
  if (leftSidebar.style.display === 'none') {
      leftSidebar.style.display = 'block';
  } else {
      leftSidebar.style.display = 'none';
  }
}
