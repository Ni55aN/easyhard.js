module.exports = function(source) {
  console.log(this.resource, this.resourcePath);
  return source;
}