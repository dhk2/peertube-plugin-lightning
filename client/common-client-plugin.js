import axios from 'axios';

async function register({ registerHook, peertubeHelpers }) {
  var basePath = await peertubeHelpers.getBaseRouterRoute();
  var timer;
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      clearInterval(timer);
      var accountName, channelName, videoName, instanceName, buttonText,button;
      let element = document.querySelector('.lightning-button')
      if (element != null) {
        element.remove();
      }



      
      let html = `
      <div _ngcontent-cav-c133="" class="lighting-buttons-block ng-star-inserted">
        <p _ngcontent-cav-c133="" display:none id = "boostagram" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="Boostagram">boostagram</p>
        </div>
        <div id="satdialog">
      <label for="from">From:</label><br>
      <input type="text" id="from" name="from" maxLength="28"><br>
      <label for="message">Message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br><br>
      `;
      console.log(path);
      let paths = (path+"/").split("/");
      let pageType = paths[1];
      let pageId = paths[2];
      let idParts = pageId.split("@");
      instanceName = idParts[1];
      console.log("path parsing info", pageType, pageId, idParts);
      buttonText = '⚡️Donate to '+location.hostname+'⚡️';
      if (pageType == "a") {
        console.log("on an account page", pageId);
        accountName = idParts[0];
        buttonText = '⚡️Boost ' + accountName + '⚡️'

      }
      if (pageType == "c") {
        console.log("on a channel page", pageId);
        channelName = idParts[0]
        buttonText = '⚡️Boost' + channelName + '⚡️'
      }
      let videoData;
      if (pageType == "w") {
        console.log("on a video page", pageId);
        videoName = idParts[0]
        try {
          videoData = await axios.get("/api/v1/videos/" + videoName);
        } catch {
          console.log("error getting data for video", videoName);
        }
        //console.log(videoData.data);
        accountName = videoData.data.account.name;
        channelName = videoData.data.channel.name;
        if (location.hostname != videoData.data.account.host) {
          instanceName = videoData.data.account.host;
        }
        buttonText = '⚡️Boost ' + accountName + '⚡️';
      }
      button =` 
      <div _ngcontent-cav-c133="" class="lighting-buttons-block ng-star-inserted">
      <p id = "satbutton" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="satbutton">`+buttonText+`</p>
      </div>
      `
      if (pageType == "my-account") {
        console.log("on my account page");
        //TODO add dialog to manually set address or pubkey info
      }
      html = html + button+'</div>';
      const panel = document.createElement('div');
      panel.setAttribute('class', 'lightning-button');
      panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      panel.id = pageType;
      panel.innerHTML = html;
      timer = setInterval(async function () {
        if ((document.querySelector('.top-menu .lightning-button') === null)) {
          const topMenu = document.querySelector('.top-menu');
          console.log("topmenu", topMenu);
          if (topMenu) {
            console.log("insterting panel into topmenu", panel)
            topMenu.appendChild(panel);
          }
          let dialogElement = document.getElementById("satdialog");
          dialogElement.style.display = "none"
          console.log(dialogElement);
          document.getElementById("boostagram").onclick = async function () {
            console.log(dialogElement.style);
            if (dialogElement.style.display !== "none") {
              dialogElement.style.display = "none";
            } else {
              dialogElement.style.display = "block";
            }
          };
          let walletApi = basePath + "/walletinfo";
          if (videoName) {
            if (instanceName) {
              walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "@" + instanceName + "&channel=" + channelName + "@" + instanceName;
            } else {
              walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "&channel=" + channelName;
            }
          } else {
            if (accountName) {
              walletApi = walletApi + "?account=" + accountName;
            }
            if (channelName) {
              walletApi = walletApi + "?channel=" + channelName;
            }
            if (instanceName) {
              walletApi = walletApi + "@" + instanceName;
            }
          }

          console.log("api call for wallet info", walletApi);
          let walletData;
          try {
            walletData = await axios.get(walletApi);
            document.getElementById("boostagram").style.display ="block";
          } catch {
            console.log("client unable to fetch wallet data\n", walletApi);
            /*
            peertubeHelpers.showModal({
              title: 'Unable to send tip',
              content: 'Unable to find any wallet info for ' + idParts[0],
              confirm: {
                value: 'OK'
              }
            })
            */
            document.getElementById("boostagram").style.display ="none";
            return;
          } 
          console.log("returned wallet data", walletData.data);
          if (walletData.data.status != 'OK') {
            console.log("server Unable to get wallet for", accountName, "\n", walletData.data);
            return;
          }



          document.getElementById("satbutton").onclick = async function () {
            let amount = document.getElementById('sats').value;
            let message = document.getElementById('message').value;
            let from = document.getElementById('from').value;

           // SendSats(walletData, amount, message);
           boost(walletData.data,amount,message,from, videoData);
          };

        } else {

        }

        /*
        if ((document.querySelector('.menu-wrapper .lightning-button') === null)) {
          const mainContent = document.querySelector('.menu-wrapper');
          console.log("maincontent", mainContent)
          if (mainContent) {
            panel.classList.add('section')
            mainContent.appendChild(panel)
            console.log("Panel added to main content", panel);
          }
        }
        */
      }, 1);
    }
  })
  async function SendSats(walletData, amount, message, name) {
    if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    console.log("parsint", parseInt(amount));
    if (parseInt(amount) < 1) {
      amount = "69";
    }
    await webln.enable();
    console.log("---------------\n", "webln enabled");
    //TODO properly build this

    let pubKey = walletData.data.pubkey;
    let tag = walletData.data.tag;
    let customKey = walletData.data.customData[0].customKey;
    let customValue = walletData.data.customData[0].customValue;
    let paymentInfo = {
      destination: pubKey,
      amount: amount,
      customRecords: {
        "34349334": message,
        "696969": customValue,
      }
    }


    console.log("payment info", paymentInfo);
    console.log("parts", paymentInfo.destination, paymentInfo.amount);
    console.log("custom records", paymentInfo.customRecords);
    await webln.keysend(paymentInfo);
  }
  async function boost(walletData, amount, message, from, videoData) {
    await webln.enable();
    console.log("boosting",walletData, amount,message,from,videoData);
    if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    console.log("parsint", parseInt(amount));
    if (parseInt(amount) < 1) {
      amount = "69";
    }
    if (!from) {
      from = "Anon";
    }
    console.log("parameters normalized");
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKey = walletData.customData[0].customKey;
    let customValue = walletData.customData[0].customValue;
    console.log("wallet variables set");
    const boost = {
      action: "boost",
      value_msat: amount*1000,
      value_msat_total: amount*1000,
      app_name: "PeerTube",
      app_version: "1.0",
      name: "PeerTube",
      sender_name: from,
      message: message,

    };
    console.log("basic boost created");
    if (videoData){
      boost.podcast= videoData.data.channel.name;
      boost.episode= videoData.data.name;
    }
    console.log("video boost updated");
    let paymentInfo = {
      destination: pubKey,
      amount: amount,
      customRecords: {
        7629169: JSON.stringify(boost),
        "696969" : customValue,
      }
    };
    console.log("payment info", paymentInfo);
    //console.log("settings", await peertubeHelpers.getSettings());
    //console.log("parts", paymentInfo.destination, paymentInfo.amount);
    //console.log("custom records", paymentInfo.customRecords);
    await webln.keysend(paymentInfo);
  }
}
export {
  register
}
