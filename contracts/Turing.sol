// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Turing is ERC20 {
    using Strings for string;

    mapping(string => address) public users;
    mapping(address => string) public codinomes;
    address private immutable owner;
    bool public voting;

    mapping(string => mapping(string => bool)) public hasVote;

    constructor() ERC20("Turing", "TUR") {
        users["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        users["nome1"] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        users["nome2"] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        users["nome3"] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        users["nome4"] = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
        users["nome5"] = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

        codinomes[users["roberta"]] = "roberta";
        codinomes[users["nome1"]] = "nome1";
        codinomes[users["nome2"]] = "nome2";
        codinomes[users["nome3"]] = "nome3";
        codinomes[users["nome4"]] = "nome4";
        codinomes[users["nome5"]] = "nome5";


        owner = msg.sender;
        voting = true;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner || msg.sender == users["roberta"],
            "Apenas owner ou professora"
        );
        _;
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function updateUser(string memory codinome, address user_addr) public onlyAdmin {
        require(codinome.equal(""), "Nome nao pode vir vazio");

        address enderecoAntigo = users[codinome];
        delete codinomes[enderecoAntigo];
        users[codinome] = user_addr;
        codinomes[user_addr] = codinome;
    }

    function votingOn() public onlyAdmin {
        voting = true;
    }

    function votingOff() public onlyAdmin {
        voting = false;
    }

    function issueToken(string memory codinome , uint256 qtde_de_Turings) public onlyAdmin {
        _mint(users[codinome], qtde_de_Turings);
    }

    function vote(string memory codinome, uint256 qtde_de_Turings) public {
        require(voting, "Votacao inativa");
        require(owner != users[codinome], "Nao pode votar em si mesmo");
        require(qtde_de_Turings > 0 && qtde_de_Turings <= 2, "Quantidade de turings invalidas");
        require(hasVote[]);



    }
}
