$(document).ready(function() {

  // if flash message exists, set timeout to fade out message after 5 seconds
  (function () {
    var checkForFlashMessage = $('.flashMessage').html();
    if (checkForFlashMessage) {
      setTimeout(function() {
        $('.flashMessage').fadeOut('slow');
      }, 5000);
    }
  })();

  /* Set the width of the side navigation to 250px */
  function openNav() {
      document.getElementById("mySidenav").style.width = "100%";
  };
  /* Set the width of the side navigation to 0 */
  function closeNav() {
      document.getElementById("mySidenav").style.width = "0";
  };
  $('.sideNavButton').on('click', function() {
    openNav();
  });
  $('.closebtn').on('click', function() {
    closeNav();
  });
});
