v 5.4.3
- cleaned up caching issues
- synched up comment and reply zaps

v 5.4.2
- fixed some issues with wallet caching
- fixed some logic issues with cross app comment zaps

V 5.4.1
- enable lightning bolt in fields for cross app comment zaps

v 5.4.0
- enabled first version of well-known/split

v 5.3.9
- fixed problem with modal not closing after boosting


v 5.3.8
- enabled detection of HiveTube and Podcast 2 plugins
- added ability to set channelGuid via route

v 5.3.7
- fixing podcast guid interaction with podcast2 plugin

v 5.3.6
- 5.2.5 fix didn't take, refixed

v 5.3.5
- fixed bug in guid diagnostic message

v 5.3.4
- fixed typo bug in value block
- fallback keysend lightning support extended to patronage and streaming, webln and api

v 5.3.3
- renamed lightning address value in value blocks to keysend as per pod sage
- added fallback to lightning address look up if static node info fails for integrated boosts
- added route to get current keysend info for a lightning address.

v 5.3.2
- removed extraneous wallet authorization calls

v 5.3.1
- Fixed adding podcast:valuerecipient when there is no block.

v 5.3.0
- added lightning address to value block in addition to node address

V 5.2.9
- fixed possible bug with accessing .data of undefined variable
- removed patronize button for non authorized users
- made weblnSupport a global variable in client and improved checking frequency

V 5.2.8
- fixed bug with value block name

V 5.2.7
- fixed issue with corrupted episode plug-in data crashing node

V 5.2.6
- attempted hotfix for bug with 6.0

v 5.2.5
- added diagnostics to figure out alby authentication failure

v 5.2.4
- fixed bug in episode level splits

v 5.2.3 
- fixed logic error in remote boost name/image
- fixed axios error in requesting federated remoteboosts

v 5.2.2
- added route for getting paid invoices to track boosts
- fixed typo in federated getsplit

v 5.2.1
- fixed mismatch between host address and host name
- fixed inadequate checking for undefineds
- fixed federated patron levels

v 5.2.0
- new channels autogenerate default split if user has boostback address defined
- fallback to wallet address of no boostback defined
- fixed crash without customvalue configured
- enabled channel configurable patron levels
- enabled federated configurable patron levels

v 5.1.9
- improved patronize/manage patronage/depatronize ui flow

v 5.1.8
- fixed bug with with null split fix
- fixed bug with undefined user name

v 5.1.7
- fixed problem with null remote value entry of a block breaking parsing.

v 5.1.6
- fixed grey text display issue with input elements
- fixed boost fiat value calculation

v 5.1.5
- worked out math for remote splits on non-live video
- cleared up some logic flow issues with boosts
- fixed hiding streaming info when not on video player
- fixed streaming payment metadata misalignment
- fixed streaming to properly use remote splits
- cleaned up console.log cals on client side
- fixed errors managing new patronage

v 5.1.4
- fixed faulty error avoidance logic
- returned upper right button to streaming indication
- fixed incorrect variable setting with authorization disabled

v 5.1.3
- Fixed patronage UI bug
- moved 4v4 button to left panel
- changed v4v configuration settings to custom route instead of modal window

v 5.1.2
- fixed redirect issue for old lightning plugin to new podcast2 plugin
- added support for split kit import ID for recorded video
- Added RSS feed support for value splits and remote items

v 5.1.1
- redid pay range calclations
- added debug module to hopefully fix npm install errors

v 5.1.0
- attempt to fix install error
- add some diagnostics to determine why patronage message pay dates aren't right

v 5.0.9
- updated TLV with remote_feed_guid and remote_item_guid for remote item boosts
- added boostagram dialog customization for remote boosts
- normalized remote boost splits

v 5.0.8
- added 301 redirect of deprecated podcast rss route to podcast2 plugin route.
- added livevalue to update episode
- added routes for livevalue
- added livevalue tag for rss feed liveitems
- added sockets-io-client library
- fixed typo in calculating patronage
- added liveremotesplit to db
- added conversion of splitkit wallet data to getalby format

v 5.0.7
- cleaned up logic issues in /getsubscriptions
- fixed failure of /createsubscriptions to return new subscription.
- added lightning address to package.json

v 5.0.6
- added account description to lightning address search
- fixed handling auto split creation for channels with lightning address in description.
- added patronage managemement.
- moved de-patronize button to management 
- fixed anonymous patronage

v 5.0.5
- fixed bugs with saved remote splits not saving and reading properly due to illegal characters
- removed podcast2 features from lightning plugin
- removed rss chat option which will be moved to podcasting 2 plugin
- refined diagnostics reporting

v 5.0.4
- fixed bug with video custom fields reinitializing when editting
- fixed problm with Podcast:txt field not showing up
- fixed issue with clearing out video custom fields
- fixed date issue in patronage message
- added split info to boost dialog
- fixed logic for less than 1 day subscription pending

v 5.0.3
- added support for 66 char pubkey reply to address
- replaced crypto library with uuidv5 library
- updated new podcast guid generation to v5
- fixed new guid to use rss feed url instead of random guid
 
v 5.0.2
- re-arranged hook code on client side to fix refreshed pages not having plugin buttons
- fixed account and address differences in walletinfo route
- fixed known caching issues with wallet info
- implented refresh=true in walletinfo route to force cached data refresh
- fixed reply address issues in cross app comment zaps
- fixed well-known saving so peertube reply addresses are also lightning addresses
- fixed reply address assignment with alby authentication.

v 5.0.1
- fixed days since last payment calculation
- added lightning address directory support
- fixed sending 0 amount autopayments

v 5.0.0 
- improved diagnostics during patronpayments to hunt down intermittant failures.
- fixed invalid token update after refresh causing host payment failures
- improved variable re-initialization on logout
- enabled multi-day subscription payments
- enabled expiring of cached wallet data

v 4.4.9
- fixed error with non-boostagram payments crashing node

v 4.4.8
- made daily patron update more reliable
- improved patronage button visibility
- fixed bug in setting reply lightning address
- seem to have fixed initial authorization status with alby login
- added necessary await to alby token refreshing.

v 4.4.7
- enhanced messaging in patronize/depatronize
- daily autopayment functions working
- changed daily check trigger
- fixed bug that deleted subscription list
- added confetti for past autopayments since last visit to channel page
- cleaned up patronage message metadata

v 4.4.6
- added routes and ui to patronize and depatronize channels
- switched to multiple transaction for subscriptions and working perfectly
- refined dedicated alby token refresh function
- initial auto payment working
- setup up daily subscription servicing routine

v 4.4.5
- fix stupid subscription iterating error

v 4.4.4
- expire old cached wallet data
- fix case issue with lud16 addresses
- fix streamlabs funding string parse issue specific to clownfish
- Change boost-url and boost-link to better support peertube internal rss
- Fix error when skipping boosts <3 sats

v 4.4.3
- fixed alby authentication error

v 4.4.2
- fixed issue with persistent live UUID including date

v 4.4.1
- fixed some missing values in RSS feed
- added season, episode, chapters, txt to episode level
- modernized string handling in custom RSS feed.
- fixed cross app comments
- improved webhook handling
- fixed consistency with wallet authorization and webln levels during logout/login/authorization cycle
- fixed podcast url in boosts for instances not using extended RSS
- fixed fall through url for getalby callbacks to instance home.
- added missing await for webln legacy split payment
- fixed confetti amount variable for webln legacy payments

v 4.4.0
- implemented confetti for webln 

v 4.3.9
- added confetti for authorized payments

v 4.3.8
- Additional server checks on fixed bug in split math

v 4.3.7
- Client side math fix for missing split data from server

V 4.3.6
- added logic to check status of webhooks

V 4.3.5
- fixed typo

v 4.3.4
- added cross app comment boost messages using bot

v 4.3.3
- fixed server side invoice parsing error

v 4.3.2
- fixed callback path generation.
- fixed bug boosting nodes without custom values

v 4.3.1
- fixed bug with disabled lnurl
- fixed bug with missing account thumbnails

v 4.3.0
- bugfix for node crashing bug with new users attempting to boost
- alby webhook and simpletip integration for boost message aggregation
- put in settings for boost bot comment posting

v 4.2.9
- resolved issue with reply to
- may have resolved issue with fee percentages
- improved error logging in client console

v 4.2.8
- bugfix

v 4.2.7
- Cleaned up channel configuration interface
- created modal for RSS configuration 
- refactored client-server communication for metadata
- added option to disable enhanced rss configuration
- added txt, medium, and guid to rss feed

v 4.2.6
- fixed error when podcast id wasn't present

v 4.2.5
- cleaned up channel management page
- fixed node crashing bug in wallet securing

v 4.2.4
- added value block support for podcasting 2.0 rss feed
- moved plugin rss feed base from rss media to podcasting 2.0
- fixed error handling for lnurl lightning addresses
- changed RSS feed to user larger avatars for person and channel images
- added more client and server side sanity checking on splits

v 4.2.3
- fixed authorize button showing up for unlogged in users or sites without api key

v 4.2.2
- fixed issue with v4v button not appearing sometimes
- fixed cross app comment zap on mobile not using authorized wallet
- fixed streaming webln support check failure
- fixed streaming double pay issue with multiple splits

v 4.2.1
- added Alby API integration to work better with browsers without WebLN
- added ability to authorize or de-authoraize an alby address
- standardized closing models after button click
- started on cleaning up boostagram metadata generation
- added rounding boost sats to an integer and not sending anything under 3 sats
- 
v 4.2.0
- fixed federated item level split
- fixed logging and error catching issues with setting user lightning address
- disabled nonworking custom node settings for user address
- cleaned up server side code
- added callback route for using alby API
 
v 4.1.9
- fixed hostsplit for channel level splits

v 4.1.8
- added video-edit-client-plugin.js and updates scripts and package
- fixed server support and added client support for episode splits
- updated hostsplit to use currently configured address

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