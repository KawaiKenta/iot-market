// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

// imports

// errors
error Merchandise__NotOwner();
error Merchandise__NotForSale();
error Merchandise__NotInProgress();
error Merchandise__NotEnoughETH();
error Merchandise__NotBuyer();

// 一度だけ購入可能な商品と繰り返し購入可能な商品
// これ以上分岐するならクラスを分ける
enum MerchandiseType {
    ONLY_ONCE,
    REPEATABLE
}

/**
 * @title Merchandise
 * @author Kenta Kawai
 * @notice IoT機器データの管理を行うコントラクト
 */
contract Merchandise {
    // type declarations
    enum MerchandiseState {
        SALE,
        IN_PROGRESS,
        SOLD,
        BANNED // 不正な商品
    }

    // state variables
    address private immutable i_owner;
    MerchandiseState public s_merchandiseState = MerchandiseState.SALE;
    MerchandiseType public i_merchandiseType;
    bytes private i_dataHash;
    uint public s_price;
    uint public s_InProgressBalance;
    address[] public s_buyers;

    // events
    event Purchase(address indexed owner, address indexed buyer);

    // constructor
    constructor(
        uint price,
        MerchandiseType merchandiseType,
        bytes memory dataHash
    ) {
        i_owner = msg.sender;
        s_price = price;
        i_merchandiseType = merchandiseType;
        i_dataHash = dataHash;
    }

    // functions
    /**
     * @notice 商品の購入
     * @dev 商品の状態がSALEでない場合は失敗する
     * @dev 商品を購入するための十分なethがない場合は失敗する
     * @dev 商品の状態をIN_PROGRESSに変更し、イベントの発火
     * @dev 検証のために、購入者と一時預り金を記録する
     */
    function purchase() public payable {
        // revert処理
        if (s_merchandiseState != MerchandiseState.SALE)
            revert Merchandise__NotForSale();
        if (msg.value < s_price) revert Merchandise__NotEnoughETH();

        s_merchandiseState = MerchandiseState.IN_PROGRESS;
        emit Purchase(i_owner, msg.sender);
        s_InProgressBalance += msg.value;
        // FIXME: 重複購入の防止と検証にO(n)のコストがかかる問題
        s_buyers.push(msg.sender);
    }

    // OPEN <-> CLOSED は所有者が変更できる
    // BANNED, SHIPPED はシステムによってのみ変更される
    function setMerchaniseState(uint8 state) public {
        if (msg.sender != i_owner) revert Merchandise__NotOwner();
        s_merchandiseState = MerchandiseState(state);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getDataHash() public view returns (bytes memory) {
        return i_dataHash;
    }

    function getPrice() public view returns (uint) {
        return s_price;
    }

    function getInProgressBalance() public view returns (uint) {
        return s_InProgressBalance;
    }

    function getBuyers() public view returns (address[] memory) {
        return s_buyers;
    }

    function getMerchandiseState() public view returns (MerchandiseState) {
        return s_merchandiseState;
    }

    function getMerchandiseType() public view returns (MerchandiseType) {
        return i_merchandiseType;
    }
}
