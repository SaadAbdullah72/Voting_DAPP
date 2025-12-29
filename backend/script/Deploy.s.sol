// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MultiElection.sol";

contract DeployPortal is Script {
    function run() external {
        // .env file se key uthayega
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        
        // Yahan FundingPortal deploy ho raha hai
        new FundingPortal();

        vm.stopBroadcast();
    }
}