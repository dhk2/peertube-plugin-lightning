v 4.1.7
- commented out enable-rss feature to fix possible bug
- fixed name for host split, and fee value in podcast rss
- added support for matrix plugin for podcast:chat

v 4.1.6
- fixed feed ID to federate
- added fix to item ID federation

v 4.1.5
- added reply_to field boosts
- add lighting address configuration for users to v4v dialog
- moved fiat tip buttons down next to boost button

v 4.1.4
- Moved stream button out of player-next and to the top right.

v 4.1.3
- fixed SplitData undefined crashing bug
- changed default values to enable payments

v 4.1.2
- fixed bug with videoEl not existing.
- fixed bug breaking split editting if chat disabled.

v 4.1.1
- fixed invalid address format error crashing plugin install

v 4.1.0
- added minimal activitypub actor format verification to prevent server crashing issue
- added try blocks around all storagemanager calls with relevant catch error messages

v 4.1.0
- added boostagram dialog to embedded boosts
- fixed lnurl issues
- added visual queues to show payments processing
- cleaned up embedded code
- Found better open source SVG for lightning icon

v 4.0.9
- added name field to create and add split
- extended autogeneration of chat room to edit dialog
- added LNURL support to embedded overlay menu
- only add lightning icon to embedded player if webln is available
- fixed problem with replies not being boostable
- fixed bug keeping common client code from updating
- fixed unneccesary api errors in boost function

v 4.0.8
- added keysend boosting to embedded video overlay menu
- fixed bug setting setting fractional boosts to 69
- fixed editting bug with custom keysend splits
- changed zaps to use comment id for html id for tracking.

v 4.0.7
- fixed behaviour issues when no webln support in browser
- set mobile behavior to launch local wallet and desktop to show QR code
- fix bugs in split editting program flow
- fix bugs with federated chat room names

v 4.0.6
- fixed errors with 0 host split channel creation.
- added tooltips for video player page buttons
- Removed non-error console.logs that aren't behind diagnostic setting switch
- disable keysend boosts even if available from wallet when keysend disabled

v 4.0.5
- improved keysend wallet info caching which improved zap performance greatly
- Added local caching of wallet info for local and remote user accounts
- Added local caching of wallet status for local and remote user accounts
- Added more sysop configuration options to enable or disable features.

v 4.0.4
- Added more error checking in split configuration dialogs
- Fixed episode_guid for federated boosts to point to the instance the episode originate from with federated boosts
- fixed boost_link to point to the instance the boost originated from.

V 4.0.3
- fixed server crashing typo

v 4.0.2
- Add more checks to prevent undefined responses from causing erratic behavior.
- fixed bugs with a split amount being undefined and added clean up code.
- fixed lnurl message bug
- improved cross app comment zap icon placement and state and aesthetics

v 4.0.1
- fixed error in chatroom autocreation
- fixed error in IRC library
- added full size chat and hidden chat
- fixed reply zaps

v 4.0.0
- added federated comment zaps
- fixed federated chatrooms
- moved zap button to action button section

v 0.3.9
- added channel configurable support IRC chat rooms
- added IRC chat support
- added fallback Podcast Index Item ID look up
- added ability to create spit from scratch through split gui
- Changed tip modal from lg to sm

v 0.3.8
- Added getversion route to server and implemented in client to populate app_version in boostagram
- cleaned up updatesplit route, adding support for video splits and manual keysend config
- fixed name field in boostagrams to use split name

v 0.3.7
- Added transcript field to podcast2 RSS
- Fixed total/split sats info in boostagrams

v 0.3.6
- fixed RSS bugs
- add lightning address dialog.

v 0.3.5
- fixed RSS feed and cross-site boosting to use splits instaed of creator wallet.

v 0.3.4
- added user configurable splits
- Fixed host split to go to hosting instance instead of viewing instance
- close superchat dialog after sending superchat

v 0.3.3
- added routes for split data
- changed walletdata to an array
- display split info in channel update window
- implemented host percentage split

v 0.3.1
- added support buttons for links to tipeeestream or streamlabs found in channel/video description/support

v 0.3.0
- Added cross app comment support to podcast RSS feed

v 0.2.8
- added storage of keysend data to allow custom configuration and cut down network traffic

v 0.2.7
- changed episode guid to the item url instead of the actual guid to match spec
- added <podcast:guid> value to podcast2 rss feed.
- fixed guid to match spec format
- fixed customkey to work properly
- added server routes to store/retrieve channel guid and full split wallet data

v 0.2.6
- Dynamically fetch bitcoin conversion rate in client

v 0.2.5
- Fixed issue with mobile wallet browsers support webln but not keysend
- Verified now working fully with Blixt wallet

v0.2.4
- fixed buttons to use channel display name instead of name
- cleaned up no webln provider dialogs

v0.2.3
- cleaned up initial variable assignment block
- disabled remnants of left side tip option
- moved html generation into discrete functions to ease collaboration.

v0.2.2
- added QR code and LNURL paste fallback option if webLN.enable fails.

v0.2.1
- fixed error where tip button wasn't being removed for non-wallet creators.
- removed confirm and maybe later buttons from support dialogs

v0.2.0 Beta 1 release candidate 1
- Fixed visual irregularities with dynamic changes to streaming amount. Added visual update for changed values from left menu.
- added basic wallet and rss feed info to channel update interface as well as ability to specify podcast index feed id for interoperability.

v0.1.9
- created changelog