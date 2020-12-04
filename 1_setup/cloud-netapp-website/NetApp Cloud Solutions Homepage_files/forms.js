(function(w){
  var mappedFields = ["firstname","lastname","phone","jobtitle","company","website","industry","company_size","annualrevenue","address","city","state_region_open_","country","zip","inactive_since","clearbit_sub_industry","clearbit_company_description"];
  var formShorteningEnabled = true;
  if (typeof w.jQuery === "undefined") {
    console.error("Clearbit for HubSpot Error: Cannot find jQuery library loaded on page.");
    return;
  }
  var $ = w.jQuery;

  w.ClearbitForHubspot.formEls = [];

  w.ClearbitForHubspot.initialize = function(){
    while (w.ClearbitForHubspot.forms.length > 0) {
      var form = w.ClearbitForHubspot.forms.pop();
      w.ClearbitForHubspot.onFormReady(form);
    };
  };

  var preventSubmitOnEnter = function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  var shouldShortenField = function(key) {
    return (formShorteningEnabled && mappedFields.indexOf(key) !== -1);
  };

  var onEnterEmail = debounce(function(event){
    var element = event.target;
    var email = element.value;
    if (!email || (email && String(email).length == 0)) {
      return false;
    };

    var emailRegex = /^.+@.+\..+$/;
    if (!(emailRegex.test(String(email)))) {
      return false;
    };

    var hostUrl = "hubspot.clearbit.com/v1";
    var protocol = ("https:" === document.location.protocol ? "https://" : "http://");

    $(element.form)
      .on("keypress", "input", preventSubmitOnEnter)
      .on("click", "input[type=submit]", false);

    var script  = document.createElement("script");
    script.type = "text/javascript";
    script.src  = `${protocol}${hostUrl}/forms/pk_46c2f04970a9dc90499062c8e3b51524/person.js?email=${encodeURIComponent(email)}`;
    script.onerror = function() {
      $(element.form)
        .off("keypress", "input", preventSubmitOnEnter)
        .off("click", "input[type=submit]", false);

      if (element.value === email) {
        w.ClearbitForHubspot.onResult(email, {});
      }
    };

    document.body.appendChild(script);
  }, 250);

  w.ClearbitForHubspot.onFormReady = function(formEl){
    var fields = {};
    var inputs = {};

    formEl.querySelectorAll("input.hs-input, select.hs-input, textarea.hs-input").forEach(function(inputEl) {
      var key = inputEl.name;

      var fieldEl = inputEl.closest("div.hs-form-field");
      inputs[key] = inputEl;
      fields[key] = fieldEl;

      if (key == "email") {
        inputEl.addEventListener("input", onEnterEmail);
      } else if (shouldShortenField(key)) {
        fieldEl.style.display = "none";
      }
    });

    w.ClearbitForHubspot.formEls.push({
      form: formEl,
      fields: fields,
      inputs: inputs,
    });
  };

  w.ClearbitForHubspot.onResult = function(email, resultAttributes){
    w.ClearbitForHubspot.formEls.forEach(function(form){
      var emailVal = form.inputs['email'].value;
      if (email !== emailVal) {
        return false;
      };

      mappedFields.forEach(function(key){
        if (!form.inputs.hasOwnProperty(key)) {
          return false;
        };

        var input = form.inputs[key],
            $input = $(input);
            $field = $input.closest("div.hs-form-field");

        if (resultAttributes.hasOwnProperty(key)) {
          if (input.type === 'checkbox' || input.type == 'radio') {
            $.makeArray(resultAttributes[key]).forEach(function(value) {
              $input.
                parents('ul').
                find("[value='" + value + "']").
                trigger('click');
            });
          } else {
            $input.val(resultAttributes[key]).change();
          }

          if (shouldShortenField(key)) {
            $field.hide();
          }
        } else {
          if ($input.val() && $input.val() !== ''){
            $input.val('').change();
          }
          $field.show();
        }
      });

      $(form.form)
        .off("keypress", "input", preventSubmitOnEnter)
        .off("click", "input[type=submit]", false);
    });
  };

  function debounce(func, time) {
    var timeout;

    return function() {
      var args = arguments;
      var context = this;
      var thisTime = time || 250;

      clearTimeout(timeout);

      timeout = setTimeout(function() {
        func.apply(context, args);
      }, thisTime);
    };
  };

  w.ClearbitForHubspot.initialize()
}(window));
