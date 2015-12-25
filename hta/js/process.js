window.resizeTo(430,480);

var fso = new ActiveXObject('Scripting.FileSystemObject');

function batchman() {
  var form = document.forms[0];
  var batfile = form.elements['batfile'].value;
  var include = form.elements['include'].checked;
  var hidcon = form.elements['hidcon'].checked;
  var completion = form.elements['completion'].checked;
  var distname = form.elements['distname'].value;
  var icon = form.elements['icon'].value || false;
  if (icon && !hasExtension(icon, 'ico')) return false;
  if (isRequired(batfile) && hasExtension(batfile, 'bat')) {
    var src = splitPath(batfile);
    distname =  distname || src.file.replace(/\.[^/.]+$/, '');
    fso.GetStandardStream(1).Write(src.folder +'~'+ src.file +'~'+ include +'~'+ hidcon +'~'+ completion +'~'+ distname +'~'+ icon);
    window.close();
  }
}

function changeCompletion() {
  var form = document.forms[0];
  var completion = form.elements['completion'];
  var hidcon = form.elements['hidcon'];
  if (hidcon.checked) {
    completion.disabled = false;
    removeClass(completion.parentNode, 'text-muted');
  } else {
    completion.disabled = true;
    completion.checked = false;
    completion.parentNode.className += ' text-muted';
  }
}

function splitPath(input) {
  input = input.split('\\');
  var file = input.pop();
  var folder = input.join('\\');
  return {'folder': folder, 'file': file};
}

function isRequired(input) {
  if (input === null || input === '') {
    errorFeedback('.is-required', 'Some values are required');
    return false;
  }
  return true;
}

function hasExtension(input, extension) {
  if (input.indexOf(extension, this.length - extension.length) == -1){
    errorFeedback('.is-' + extension, 'Not a ' + extension + ' file');
    return false;
  } 
  return true;
}

function errorFeedback(els, message){
  forEachEl(els, function(el, i){
    el.className += ' has-error has-feedback';
    var feedback = el.querySelectorAll('.form-control-feedback')[0];
    removeClass(feedback, 'hide');
  });
  alert(message);
}

function forEachEl(selector, fn) {
  var elements = document.querySelectorAll(selector);
  for (var i = 0; i < elements.length; i++)
    fn(elements[i], i);
}

function removeClass(el, classToRemove) {
  el.className = el.className.replace(new RegExp('(^|\\b)' + classToRemove.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}