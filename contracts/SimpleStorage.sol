// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract SimpleStorage {
    // boolean, uint, int, string, address, bytes
    uint256 public number;

    function store(uint256 _number) public virtual {
        number = _number;
    }

    // view, pure
    function retrive() public view returns (uint256) {
        console.log("retrive is called by %s", msg.sender);
        return number;
    }
}
