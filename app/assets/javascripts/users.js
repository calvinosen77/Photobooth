$(document).ready(function () {

  var filters = new Filter();
  filters.initialize();
  
  var photo_booth = new PhotoBooth();
  photo_booth.initialize(filters);

});