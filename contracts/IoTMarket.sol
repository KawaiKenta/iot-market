// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Merchandise.sol";
import "./PubKey.sol";

/**
 * @title IoTMarket
 * @author Kenta Kawai
 * @notice Merchandiseコントラクトの管理を一元的に行うコントラクト
 * Dappsのフロントエンドに必要な情報を提供する
 */
contract IoTMarket {
    Merchandise[] public s_merchandises;
    PubKey public immutable i_pubKey;

    constructor(PubKey pubKey) {
        i_pubKey = pubKey;
    }

    // functions
    /**
     * @notice 商品のデプロイ
     * @dev 実際の商品のデプロイはMerchandiseコントラクトで行う
     */
    function deployMerchandise(uint256 price, bytes32 dataHash) public {
        Merchandise merchandise = new Merchandise(price, dataHash, i_pubKey);
        s_merchandises.push(merchandise);
    }

    function getMerchandises() public view returns (Merchandise[] memory) {
        return s_merchandises;
    }

    function getMerchandise(uint256 index) public view returns (Merchandise) {
        return s_merchandises[index];
    }

    function getPubKeyAddress() public view returns (address) {
        return address(i_pubKey);
    }
}
