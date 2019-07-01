/**
 *  nav.js
 *  this is a custom looker vis for rendering bootstrap nav pills
 *
 *  usage - configure looker vis settings as below
 *
 *  main: https://dl.dropboxusercontent.com/s/50iydrtuwzaml33/nav.js?raw=1
 *
 *  javascript dependencies: https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js,https://stackpath.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js
 
 *  css: https://stackpath.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css
 */
var nav_count = 8
var navjs = {
  loadCss: "https://stackpath.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css",
  visElementStyles: { "margin": "0px" }
}

var options = {}
// Nav Links Sections
for (var i=0; i<nav_count; i++) {
  var section = `Nav${i+1}`
  options[`nav_${i+1}_label`] = {
    order: 1,
    section: section,
    label: "Label",
    type: "string",
    display_size: "normal",
    placeholder: ""
  }
  options[`nav_${i+1}_dashboard_id`] = {
    order: 2,
    section: section,
    label: "Dashboard ID",
    type: "string",
    display_size: "half",
    placeholder: "55 or mymodel::mylookml"
  }
  options[`nav_${i+1}_filterset`] = {
    order: 3,
    section: section,
    label: "Dashboard Filter Set",
    type: "string",
    values: [
      {"None": ""},
      {"MS Campaign, KPI, Date":    "nav_filterset_ms_campaign_kpi_date"},
      {"MS KPI, Date ID":           "nav_filterset_ms_kpi_date"}
    ],
    display: "select",
    display_size: "half",
    default: ""
  }
  options[`nav_${i+1}_url`] = {
    order: 4,
    section: section,
    label: "Custom URL",
    type: "string",
    placeholder: "URL to non-dashboard page"
  }
}

// Style Section
options.widget = {
    section: "Style",
    order: 1,
    type: "string",
    label: "Widget",
    values: [
      {"Pills": "nav-pills"},
      {"Tabs":  "nav-tabs"},
      {"Links": "nav-links"}
    ],
    display: "select",
    display_size: "third",
    default: "nav-pills"
  }
options.size = {
    section: "Style",
    order: 2,
    type: "string",
    label: "Size",
    values: [
      {"Large": "large"},
      {"Normal": "normal"},
      {"Small":  "small"}
    ],
    display: "select",
    display_size: "third",
    default: "normal"
  }
options.align = {
  section: "Style",
  order: 3,
  type: "string",
  label: "Align",
  values: [
    {"Normal":    ""},
    {"Stacked":  "nav-stacked"},
    //{"Center":    "justify-content-center"},
    //{"Right":     "justify-content-right"},
    //{"Fill":      "nav-fill"},
    {"Justified": "nav-justified"}
  ],
  display: "select",
    display_size: "third",
  default: ""
}
options.listClass = {
    section: "Style",
    order: 4,
    type: "string",
    label: "Custom List Class",
    default: "",
    display_size: "half",
    placeholder: "CSS classname"
  }
options.listItemClass = { 
    section: "Style",
    order: 5,
    type: "string",
    label: "Custom List Item Class",
    default: "",
    display_size: "half",
    placeholder: "CSS classname"
  }

looker.plugins.visualizations.add({
  options: options,
  create: function(element, config){
    console.log("nav.js create() v0.1.2")
  },
  updateAsync: function(data, element, config, queryResponse, details, doneRendering){
    navjs.data = data
    navjs.element = element
    navjs.config = config
    navjs.queryResponse = queryResponse
    navjs.details = details
    console.log("nav.js updateAsync() navjs=", navjs)

    // Nav Actions -- WIP
    navjs.actions = {}
    navjs.actions.getLink = function () {
      return navjs.data[0].link
    }
    navjs.actions.openDrillMenu = function () { 
      var link = navjs.actions.getLink()
      var cell = LookerCharts.Utils.htmlForCell(link)
      LookerCharts.Utils.openDrillMenu({
        links: [{ label: "click drill", type: 'drill', type_label: "type", url: link }],
        element: $(navjs.element),
        event: $(navjs.element)}) 
    }
    navjs.actions.getHtml = function () {
      return LookerCharts.Utils.htmlForCell(navjs.actions.getLink())
    }
    navjs.actions.openUrl = function (url) {
      return LookerCharts.Utils.openUrl(url)
    }
   

    var $el = $(element)
    if (navjs.loadCss) {
      $el.parent().after(`<link rel="stylesheet" href="${navjs.loadCss}" crossorigin="anonymous">`)
      navjs.loadCss = ""
    }

    // Build nav items from config
    navjs.navs = []
    for (var i=0; i<nav_count; i++) {
      if (config[`nav_${i+1}_label`]) {
        var nav = { label: config[`nav_${i+1}_label`] || '',
                    filterset: config[`nav_${i+1}_filterset`],
                    dashboard_id: config[`nav_${i+1}_dashboard_id`],
                    url: config[`nav_${i+1}_url`] || '#',
                    classname: '',
                    href: '#'}
        // Build href based on type
        if (nav.dashboard_id) {
          nav.href = '/embed/dashboards/'+nav.dashboard_id+'?navjs=1'
          nav.filterURLParams = ''
          if (navjs.data && navjs.data[0]) {
            nav.filterLink = navjs.data[0]["_parameters."+nav.filterset]
            if (nav.filterLink && nav.filterLink.html) {
              nav.filterURLParams = $('<div/>').html(nav.filterLink.html).text()
            }
          }
          nav.url += nav.filterURLParams
        }
        else if (nav.url) {
          nav.href = nav.url
        }
        // The "Active" nav item
        if (nav.href === "#") {
          nav.className = "active"
        }
        navjs.navs.push(nav)
      }
    }
    console.log("navjs.navs=", navjs.navs)

    config.align = config.align || ''
    config.listClass = config.listClass || ''
    config.listItemClass = config.listItemClass || ''

    // Render the nav ui
    var sizes = {
      large: { list: "", item: ""},
      normal: { list: "small", item: "" },
      small: { list: "small", item: "small" }
    }
    var size = sizes[config.size] || sizes.normal
    var $ul = $(`<ul class="nav ${config.widget} ${size.list} ${config.align} ${config.listClass}">`)
    navjs.navs.forEach(function(nav) {
      $ul.append(`<li class="${nav.className} ${size.item} ${config.listItemClass}"><a href="${nav.href}">${nav.label}</a></li>`)
    })
    $el.css(navjs.visElementStyles)
    $el.html($(`<div class="container" style="padding: 0px;">`).html($ul))
    console.log("doneRending nav.js")
    doneRendering()
  }

});




