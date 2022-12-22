//                                                                        ,-,
//                            *                      .                   /.(              .
//                                       \|/                             \ {
//    .                 _    .  ,   .    -*-       .                      `-`
//     ,'-.         *  / \_ *  / \_      /|\         *   /\'__        *.                 *
//    (____".         /    \  /    \,     __      .    _/  /  \  * .               .
//               .   /\/\  /\/ :' __ \_  /  \       _^/  ^/    `—./\    /\   .
//   *       _      /    \/  \  _/  \-‘\/  ` \ /\  /.' ^_   \_   .’\\  /_/\           ,'-.
//          /_\   /\  .-   `. \/     \ /.     /  \ ;.  _/ \ -. `_/   \/.   \   _     (____".    *
//     .   /   \ /  `-.__ ^   / .-'.--\      -    \/  _ `--./ .-'  `-/.     \ / \             .
//        /     /.       `.  / /       `.   /   `  .-'      '-._ `._         /.  \
// ~._,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'
// ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~~
// ~~    ~~~~    ~~~~     ~~~~   ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~
//     ~~     ~~      ~~      ~~      ~~      ~~      ~~      ~~       ~~     ~~      ~~      ~~
//                          ๐
//                                                                              _
//                                                  ₒ                         ><_>
//                                  _______     __      _______
//          .-'                    |   _  "\   |" \    /" _   "|                               ๐
//     '--./ /     _.---.          (. |_)  :)  ||  |  (: ( \___)
//     '-,  (__..-`       \        |:     \/   |:  |   \/ \
//        \          .     |       (|  _  \\   |.  |   //  \ ___
//         `,.__.   ,__.--/        |: |_)  :)  |\  |   (:   _(  _|
//           '._/_.'___.-`         (_______/   |__\|    \_______)                 ๐
//
//                  __   __  ___   __    __         __       ___         _______
//                 |"  |/  \|  "| /" |  | "\       /""\     |"  |       /"     "|
//      ๐          |'  /    \:  |(:  (__)  :)     /    \    ||  |      (: ______)
//                 |: /'        | \/      \/     /' /\  \   |:  |   ₒ   \/    |
//                  \//  /\'    | //  __  \\    //  __'  \   \  |___    // ___)_
//                  /   /  \\   |(:  (  )  :)  /   /  \\  \ ( \_|:  \  (:      "|
//                 |___/    \___| \__|  |__/  (___/    \___) \_______)  \_______)
//                                                                                     ₒ৹
//                          ___             __       _______     ________
//         _               |"  |     ₒ     /""\     |   _  "\   /"       )
//       ><_>              ||  |          /    \    (. |_)  :) (:   \___/
//                         |:  |         /' /\  \   |:     \/   \___  \
//                          \  |___     //  __'  \  (|  _  \\    __/  \\          \_____)\_____
//                         ( \_|:  \   /   /  \\  \ |: |_)  :)  /" \   :)         /--v____ __`<
//                          \_______) (___/    \___)(_______/  (_______/                  )/
//                                                                                        '
//
//            ๐                          .    '    ,                                           ₒ
//                         ₒ               _______
//                                 ____  .`_|___|_`.  ____
//                                        \ \   / /                        ₒ৹
//                                          \ ' /                         ๐
//   ₒ                                        \/
//                                   ₒ     /      \       )                                 (
//           (   ₒ৹               (                      (                                  )
//            )                   )               _      )                )                (
//           (        )          (       (      ><_>    (       (        (                  )
//     )      )      (     (      )       )              )       )        )         )      (
//    (      (        )     )    (       (              (       (        (         (        )
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";

contract BWLMetadataBridge is NonblockingLzApp, ERC2771Recipient, Versioned {
  // State
  uint16 public destChainId;
  mapping(address => Metadata) public contractsMetadata;
  // Structs
  struct Metadata {
    address tokenAddress;
    string name;
    string symbol;
  }
  // Enums
  enum MessageType {
    REQUEST,
    RESPONSE
  }
  // Events
  event StoreMetadata(address tokenAddress, string name, string symbol);
  event SendMetadata(address tokenAddress, string name, string symbol);
  // Errors
  error TokenDoesNotExist(address tokenAddress);

  constructor(
    address _lzEndpoint,
    uint16 _destChainId,
    address _forwarder,
    string memory _version
  ) NonblockingLzApp(_lzEndpoint) Versioned(_version) {
    destChainId = _destChainId;
    _setTrustedForwarder(_forwarder);
  }

  function _nonblockingLzReceive(
    uint16,
    bytes memory,
    uint64,
    bytes memory _payload
  ) internal override {
    (MessageType messageType, address tokenAddress) = abi.decode(
      _payload,
      (MessageType, address)
    );
    if (messageType == MessageType.REQUEST) {
      IERC721Metadata metadata = IERC721Metadata(tokenAddress);
      // Check metadata existence
      if (
        bytes(metadata.name()).length == 0 &&
        bytes(metadata.symbol()).length == 0
      ) revert TokenDoesNotExist(tokenAddress);
      // Send metadata to the requested contract
      _sendMetadata(Metadata(tokenAddress, metadata.name(), metadata.symbol()));
      emit SendMetadata(tokenAddress, metadata.name(), metadata.symbol());
    } else if (messageType == MessageType.RESPONSE) {
      (, Metadata memory metadata) = abi.decode(
        _payload,
        (MessageType, Metadata)
      );

      contractsMetadata[metadata.tokenAddress] = metadata;
      emit StoreMetadata(metadata.tokenAddress, metadata.name, metadata.symbol);
    }
  }

  function _sendMetadata(Metadata memory metadata) public payable {
    _lzSend(
      destChainId,
      abi.encode(MessageType.RESPONSE, metadata), // Encoded metadata payload
      payable(_msgSender()),
      address(0x0),
      bytes(""),
      msg.value
    );
  }

  function requestMetadata(address _address) external payable {
    _lzSend(
      destChainId,
      abi.encode(MessageType.REQUEST, _address), // Encoded metadata payload
      payable(_msgSender()),
      address(0x0),
      bytes(""),
      msg.value
    );
  }

  function trustAddress(address _otherContract) external onlyOwner {
    trustedRemoteLookup[destChainId] = abi.encodePacked(
      _otherContract,
      address(this)
    );
  }

  function _msgSender()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (address sender)
  {
    sender = ERC2771Recipient._msgSender();
  }

  function _msgData()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (bytes calldata ret)
  {
    return ERC2771Recipient._msgData();
  }
}
