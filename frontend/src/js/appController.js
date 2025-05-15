/**
 * @license
 * MIT License
 * 
 * Copyright (c) 2024,2025 PaoloB
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * @ignore
 */

define(['ojs/ojcontext', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'knockout', 'ojs/ojarraydataprovider', 'text!comuni.json',
  'ojs/ojknockout',
  'oj-c/menu-button', 'oj-c/form-layout', 'oj-c/input-text', 'oj-c/radioset', 'oj-c/input-date-picker', 'oj-c/select-single', 'oj-c/button', 'oj-c/toolbar', 'oj-c/dialog'],
  function (Context, ResponsiveUtils, ResponsiveKnockoutUtils, ko, ArrayDataProvider, comuniArray) {

    function ControllerViewModel() {

      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

      // Header
      // Application Name used in Branding Area
      this.appName = ko.observable("Calcolo Codice Fiscale");
      // Help Menu used in Global Navigation area
      this.appMenu = ko.observable("Help");
      this.spacing = ko.observable('lg');
      this.helpMenuItems = ko.computed(() => {
        return [
          {
            type: 'menu-button',
            label: 'Help',
            'aria-controls': 'toolbarItemAction',
            startIcon: { class: 'oj-ux-ico-help' },
            items: [
              {
                type: 'item',
                label: 'About',
                key: 'about',
                display: 'icons',
                'aria-controls': 'toolbarItemAction',
                onAction: () => {
                  this.open();
                }
              }
            ]
          }
        ]
      }
      );

      // About dialog box handlers
      this.isOpened = ko.observable(false);
      this.close = () => {
        this.isOpened(false);
      };
      this.open = () => {
        this.isOpened(true);
      };

      // Body
      // Input
      this.userName = ko.observable();
      this.userSurname = ko.observable();
      this.userGender = ko.observable("M");
      this.userBirthdate = ko.observable("1970-01-01");
      this.userTownOfBirth = ko.observable();
      // Output
      let self = this;
      self.fiscalCode = ko.observable();
      // Other variables
      this.genderOptions = [
        { value: "M", label: "Maschio" },
        { value: "F", label: "Femmina" }
      ]
      this.dayBirthdate = ko.observable();
      this.monthBirthdate = ko.observable();
      this.yearBirthdate = ko.observable();
      // Data Providers
      this.italianTownsDP = new ArrayDataProvider(JSON.parse(comuniArray), { keyAttributes: 'nome' });
      // Handlers
      this.calculateButtonHandler = function (event) {
        let parsedDate = this.userBirthdate().split("-");
        this.yearBirthdate(parsedDate[0]);
        this.monthBirthdate(parsedDate[1]);
        this.dayBirthdate(parsedDate[2]);
        let payload = {
          name: this.userName(),
          surname: this.userSurname(),
          gender: this.userGender(),
          day: this.dayBirthdate(),
          month: this.monthBirthdate(),
          year: this.yearBirthdate(),
          town: this.userTownOfBirth().toUpperCase()
        };

        $.post({
          url: "http://localhost:9000/cf",
          data: JSON.stringify(payload),
          contentType: 'application/json',
          success: function (data) {
            self.fiscalCode(data.message);
          }
        });
      }.bind(this);

      // Footer
      this.footerLinks = [
        { name: 'Source on GitHub', linkId: 'github', linkTarget: 'https://github.com/paolobellardone/codicefiscale' },
        { name: "License", id: "license", linkTarget: "https://github.com/paolobellardone/codicefiscale/blob/main/LICENSE" },
      ];
    }

    // release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();

    return new ControllerViewModel();
  }
);
