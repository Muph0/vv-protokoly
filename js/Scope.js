// EvalScope class
//   aScope.eval(str) -- eval a string within the scope
//   aScope.newNames(name...) - adds vars to the scope

function EvalScope() {
  "use strict";
  this.names = [];
  this.eval = function(s) {
    return eval(s);
  };
}

EvalScope.prototype.declare = function() {
  "use strict";
  var names = [].slice.call(arguments);
  var newNames = names.filter((x)=> !this.names.includes(x));

  if (newNames.length) {
    var i, len;
    var totalNames = newNames.concat(this.names);
    var code = "(function() {\n";

    for (i = 0, len = newNames.length; i < len; i++) {
      code += 'var ' + newNames[i] + ' = null;\n';
    }
    code += 'return function(str) {return eval(str)};\n})()';
    this.eval = this.eval(code);
    this.names = totalNames;
  }
}