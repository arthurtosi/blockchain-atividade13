// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Turing is ERC20 {
    mapping(string => address) public users;
    mapping(address => string) public codinomes;
    mapping(string => mapping(string => bool)) public hasVote;
    mapping(string => uint256) public voteCount;
    address private immutable owner;
    bool public voting = false;

    constructor() ERC20("Turing", "TUR") {
        users["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        users["nome1"] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        users["nome2"] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        users["nome3"] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        users["nome4"] = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
        users["nome5"] = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;
        users["nome6"] = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;
        users["nome7"] = 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955;
        users["nome8"] = 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f;
        users["nome9"] = 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720;
        users["nome10"] = 0xBcd4042DE499D14e55001CcbB24a551F3b954096;
        users["nome11"] = 0x71bE63f3384f5fb98995898A86B02Fb2426c5788;
        users["nome12"] = 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a;
        users["nome13"] = 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec;
        users["nome14"] = 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097;
        users["nome15"] = 0xcd3B766CCDd6AE721141F452C550Ca635964ce71;
        users["nome16"] = 0x2546BcD3c84621e976D8185a91A922aE77ECEc30;
        users["nome17"] = 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E;
        users["nome18"] = 0xdD2FD4581271e230360230F9337D5c0430Bf44C0;
        users["nome19"] = 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199;

        codinomes[users["roberta"]] = "roberta";
        codinomes[users["nome1"]] = "nome1";
        codinomes[users["nome2"]] = "nome2";
        codinomes[users["nome3"]] = "nome3";
        codinomes[users["nome4"]] = "nome4";
        codinomes[users["nome5"]] = "nome5";
        codinomes[users["nome6"]] = "nome6";
        codinomes[users["nome7"]] = "nome7";
        codinomes[users["nome8"]] = "nome8";
        codinomes[users["nome9"]] = "nome9";
        codinomes[users["nome10"]] = "nome10";
        codinomes[users["nome11"]] = "nome11";
        codinomes[users["nome12"]] = "nome12";
        codinomes[users["nome13"]] = "nome13";
        codinomes[users["nome14"]] = "nome14";
        codinomes[users["nome15"]] = "nome15";
        codinomes[users["nome16"]] = "nome16";
        codinomes[users["nome17"]] = "nome17";
        codinomes[users["nome18"]] = "nome18";
        codinomes[users["nome19"]] = "nome19";

        

        owner = msg.sender;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner || msg.sender == users["roberta"],
            "Apenas owner ou professora"
        );
        _;
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function updateUser(string memory codinome, address user_addr) public onlyAdmin {
        require(bytes(codinome).length > 0, "Codinome vazio");
        require(user_addr != address(0), "Endereco invalido");
        address enderecoAntigo = users[codinome];
        require(
            bytes(codinomes[user_addr]).length == 0 ||
                keccak256(bytes(codinomes[user_addr])) == keccak256(bytes(codinome)),
            "Endereco ja cadastrado"
        );
        if (enderecoAntigo != address(0) && enderecoAntigo != user_addr) {
            delete codinomes[enderecoAntigo];
        }
        users[codinome] = user_addr;
        codinomes[user_addr] = codinome;
        voting = true;
    }

    function votingOn() public onlyAdmin {
        voting = true;
    }

    function votingOff() public onlyAdmin {
        voting = false;
    }

    function issueToken(string memory codinome , uint256 qtde_de_Turings) public onlyAdmin {
        address carteira = users[codinome];
        require(carteira != address(0), "Codinome nao encontrado");
        _mint(carteira, qtde_de_Turings);
    }

    function vote(string memory codinome, uint256 qtde_de_Turings) public {
        require(voting, "Votacao inativa");
        string memory eleitor = codinomes[msg.sender];
        require(bytes(eleitor).length > 0, "Usuario nao autorizado");
        address carteiraDestino = users[codinome];
        require(carteiraDestino != address(0), "Codinome nao encontrado");
        require(carteiraDestino != msg.sender, "Nao pode votar em si mesmo");
        require(carteiraDestino != users["roberta"], "Destino deve ser aluno");
        require(qtde_de_Turings > 0 && qtde_de_Turings <= 2, "Quantidade deve ser 1 ou 2");
        require(!hasVote[eleitor][codinome], "Ja votou neste aluno");

        hasVote[eleitor][codinome] = true;
        voteCount[eleitor] += 1;
        _mint(carteiraDestino, qtde_de_Turings);
        if (voteCount[eleitor] % 10 == 0) {
            _mint(msg.sender, 1);
        }
    }
}
