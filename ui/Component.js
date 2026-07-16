sap.ui.define(
  ['sap/ui/core/UIComponent', 'sap/ui/core/HTML', 'sap/m/Page'],
  function (UIComponent, HTML, Page) {
    'use strict'
    return UIComponent.extend('predictivereturns.Component', {
      metadata: {
        manifest: 'json',
      },
      createContent: function () {
        const sBaseUrl = this.getManifestObject().resolveUri('index.html')
        const oHtml = new HTML({
          content:
            '<iframe src="' +
            sBaseUrl +
            '" style="width:100%;height:100vh;border:none;display:block;"></iframe>',
          preferDOM: true,
          sanitizeContent: false,
        })
        return new Page({
          showHeader: false,
          content: [oHtml],
        })
      },
    })
  }
)
