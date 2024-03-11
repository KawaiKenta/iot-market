// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

// imports

// errors
error Merchandise__NotOwner();
error Merchandise__NotForSale();
error Merchandise__AlreadyPurchased();
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
    MerchandiseType public immutable i_merchandiseType;
    bytes32 private immutable i_dataHash;
    uint public s_confirmedBalance;
    uint public s_price;
    mapping(address => uint) public s_progressBuyers;
    mapping(address => bool) public s_confirmedBuyers;

    // events
    event Purchase(address indexed owner, address indexed buyer);
    event Confirm(address indexed owner);

    // constructor
    constructor(uint price, MerchandiseType merchandiseType, bytes32 dataHash) {
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
        if (s_progressBuyers[msg.sender] > 0)
            revert Merchandise__AlreadyPurchased();

        s_merchandiseState = MerchandiseState.IN_PROGRESS;
        emit Purchase(i_owner, msg.sender);
        s_progressBuyers[msg.sender] = msg.value;
    }

    /**
     * @notice データの購入者だけ呼べる関数。実データをもとに作成したHashを比較
     * でき、真正性を確認する。
     * @dev 受け取ったデータに対して検証せず、無理やりfalseにした場合はどうするか...?
     * @dev この関数をよぶ状態としては、IN_PROGRESS, BANNEDがありえる
     * @dev とりあえずシンプルにbanned or 失敗ならbannedにして返金して終了、それ以外なら商品の状態を変更し、確定金額に加算して終了
     */
    function confirm(bytes32 dataHash) public returns (bool) {
        if (s_progressBuyers[msg.sender] == 0) revert Merchandise__NotBuyer();
        uint balance = s_progressBuyers[msg.sender];
        delete s_progressBuyers[msg.sender];

        // 真正性が確認できない場合は、商品をBANNEDにして、購入者に返金する
        if (
            i_dataHash != dataHash ||
            s_merchandiseState == MerchandiseState.BANNED
        ) {
            s_merchandiseState = MerchandiseState.BANNED;
            payable(msg.sender).transfer(balance);
            return false;
        }

        // typeの変更
        if (i_merchandiseType == MerchandiseType.ONLY_ONCE) {
            s_merchandiseState = MerchandiseState.SOLD;
        } else {
            s_merchandiseState = MerchandiseState.SALE;
        }
        // 確定金額に加算して、購入者リストに追加
        s_confirmedBalance += balance;
        s_confirmedBuyers[msg.sender] = true;
        emit Confirm(i_owner);
        return true;
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

    function getDataHash() public view returns (bytes32) {
        return i_dataHash;
    }

    function isConfirmedBuyer(address buyer) public view returns (bool) {
        return s_confirmedBuyers[buyer];
    }

    function getPrice() public view returns (uint) {
        return s_price;
    }

    function isProgressBuyer(address buyer) public view returns (uint) {
        return s_progressBuyers[buyer];
    }

    function getConfirmedBalance() public view returns (uint) {
        return s_confirmedBalance;
    }

    function getMerchandiseState() public view returns (MerchandiseState) {
        return s_merchandiseState;
    }

    function getMerchandiseType() public view returns (MerchandiseType) {
        return i_merchandiseType;
    }
}
