// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

// imports

// errors
error Merchandise__NotOwner();
error Merchandise__NotForSale();
error Merchandise__Bunned();
error Merchandise__AlreadyPurchased();
error Merchandise__NotInProgress();
error Merchandise__NotEnoughETH();
error Merchandise__NotBuyer();
error Merchandise__WithdrawFailed();

/**
 * @title Merchandise
 * @author Kenta Kawai
 * @notice IoT機器データの管理を行うコントラクト
 */
import "hardhat/console.sol";

contract Merchandise {
    // type declarations
    enum MerchandiseState {
        SALE,
        IN_PROGRESS,
        BANNED // 不正な商品
    }

    // state variables
    uint public constant RETRY_LIMIT = 10;
    address private immutable i_owner;
    bytes32 private immutable i_dataHash;
    uint public i_price;
    MerchandiseState public s_merchandiseState = MerchandiseState.SALE;
    uint public s_trialCount = 0;
    address public s_progressBuyer;
    mapping(address => bool) public s_confirmedBuyers;

    // events
    event Purchase(address indexed owner, address indexed buyer);
    event Verify(
        address indexed owner,
        address indexed buyer,
        bool indexed result
    );

    // constructor
    constructor(uint price, bytes32 dataHash) {
        i_owner = tx.origin;
        i_price = price;
        i_dataHash = dataHash;
        console.log(
            "constructor is called: address:%s, call:%s",
            address(this),
            msg.sender
        );
    }

    // functions
    /**
     * @notice 商品の購入
     * @dev 商品の状態がSALEでない場合は失敗する
     * @dev 商品を購入するための十分なethがない場合は失敗する
     * @dev 商品の状態をIN_PROGRESSに変更し、イベントの発火
     * @dev この時点で購入者は通貨を払う
     */
    function purchase() public payable {
        if (s_merchandiseState != MerchandiseState.SALE)
            revert Merchandise__NotForSale();
        if (msg.value < i_price) revert Merchandise__NotEnoughETH();
        if (s_confirmedBuyers[msg.sender] == true)
            revert Merchandise__AlreadyPurchased();

        s_merchandiseState = MerchandiseState.IN_PROGRESS;
        s_progressBuyer = msg.sender;
        emit Purchase(i_owner, msg.sender);
        console.log(
            "purchase is called: address:%s, call:%s",
            address(this),
            msg.sender
        );
    }

    /**
     * @notice データ購入者が実データの完全性を検証するための関数。実データをもとに作成したHashを比較し、完全性を確認する。
     * @dev できるだけシンプルにするため、今回は同時購入を考慮しない。
     * @dev 購入者、提供者の双方に悪意はなく途中経路での改竄があり得ると仮定する。
     * @dev RETRY_LIMIT回まで要求する。それ以上の場合は商品をBANNEDにする。
     * @return 完全性が確認できた場合はtrue、できなかった場合はfalse
     */
    function verify(bytes32 dataHash) public returns (bool) {
        // 購入者でない or 購入手続き中でないなら失敗
        if (s_merchandiseState != MerchandiseState.IN_PROGRESS)
            revert Merchandise__NotInProgress();
        if (s_progressBuyer != msg.sender) revert Merchandise__NotBuyer();

        s_trialCount++;
        // 完全性が確認できない場合は、商品をBANNEDにして、購入者に返金する
        if (i_dataHash != dataHash && s_trialCount < RETRY_LIMIT) {
            // データの再送を要求
            emit Verify(i_owner, msg.sender, false);
            return false;
        } else if (i_dataHash != dataHash && s_trialCount >= RETRY_LIMIT) {
            s_merchandiseState = MerchandiseState.BANNED;
            return false;
        }

        // 完全性が確認できた場合にSALEに戻し、販売者に提供が完了したことを通知
        s_merchandiseState = MerchandiseState.SALE;
        s_trialCount = 0;
        s_progressBuyer = address(0);
        s_confirmedBuyers[msg.sender] = true;
        emit Verify(i_owner, msg.sender, true);
        console.log(
            "verify is called: address:%s, call:%s",
            address(this),
            msg.sender
        );
        return true;
    }

    /**
     * @notice 販売者が処理確定された通貨を引き出すための関数
     * @dev この関数は、販売者だけがBANされていないものに対してのみ呼び出すことができる
     */
    function withdraw() public {
        if (msg.sender != i_owner) revert Merchandise__NotOwner();
        if (s_merchandiseState == MerchandiseState.BANNED)
            revert Merchandise__Bunned();

        (bool success, ) = i_owner.call{value: address(this).balance}("");
        if (!success) revert Merchandise__WithdrawFailed();
        console.log(
            "withdraw is called: address:%s, call:%s",
            address(this),
            msg.sender
        );
    }

    function getRetryLimit() public pure returns (uint) {
        return RETRY_LIMIT;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getDataHash() public view returns (bytes32) {
        return i_dataHash;
    }

    function getPrice() public view returns (uint) {
        return i_price;
    }

    function getState() public view returns (MerchandiseState) {
        return s_merchandiseState;
    }

    function getTrialCount() public view returns (uint) {
        return s_trialCount;
    }

    function getProgressBuyer() public view returns (address) {
        return s_progressBuyer;
    }

    function isConfirmedBuyer(address buyer) public view returns (bool) {
        return s_confirmedBuyers[buyer];
    }
}
