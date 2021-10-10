
//버전
pragma solidity ^0.4.19;


//컨트랙트 생성
import "./ownable.sol";
//상속!
contract ZombieFactory is Ownable {
    //이벤트의 선언법
    event NewZombie(uint zombieId, string name, uint dna);

    //자료형까지 포함해서 변수 선언, 선언 후 연산
    uint dnaDigits = 16;
    uint dnaModulus = 10 ** dnaDigits;
    uint cooldownTime = 1 days;

    //컨트랙트 안에 앞으로 쓰일 값들의 원형이 되는 구조체 형성
    struct Zombie {
        string name;
        uint dna;
        uint32 level;
        uint32 readyTime;
    }

    //선언된 구조체 활용해서 zombies라는 이름의 배열 형성
    Zombie[] public zombies;


    //함수 선언, 역시 자료형
    function createZombie(string _name, uint _dna) {
        //배열안에 구조체를 활용해서 값을 넣는다
        zombies.push(Zombie(_name, _dna));
    }

    //struct와 같이 mapping을 통해서 key => value로 값을 저장한다. address는 새로운 자료형
    mapping (uint => address) public zombieToOwner;
    mapping (address => uint) ownerZombieCount;

    //public과 private 함수 
    function _createZombie(string _name, uint _dna) private {
        uint id = zombies.push(Zombie(_name, _dna, 1, uint32(now + cooldownTime))) - 1;
        //구조체, 배열안에 집어 넣기, 선언한 이벤트의 실행으로 무슨 일이 일어났음을 알림
        uint id = zombies.push(Zombie(_name, _dna)) - 1;
        //선언 된 mapping을 사용한다 앞은 key 뒤는 value로 값을 집어 넣고
        zombieToOwner[id] = msg.sender;
        //key를 통해서 해당 mapping을 호출해서 값을 바꾼다
        ownerZombieCount[msg.sender]++;
        NewZombie(id, _name, _dna);
    }

    //return 값
    function _generateRandomDna(string _str) private view returns (uint) {
        
        //전에 배웠던 암호화와 형 변환
        uint rand = uint(keccak256(_str));
        return rand % dnaModulus;
    }

    //함수, 함수 호출 후 값을 넣기, 넣은 값을 또 다른 함수에 넣기.
    function createRandomZombie(string _name) public {

        //if문이라고 생각하면 된다!
        require(ownerZombieCount[msg.sender] == 0);
        uint randDna = _generateRandomDna(_name);
        _createZombie(_name, randDna);
    }
}

//react 때 사용했던 import!!
import "./zombiefactory.sol";
//상속이다 앞은 자식, 뒤는 부모

//contract의 뼈대처럼 보이는 interface 무언가 struct처럼 보이기도 한다.
// 인자값 하나만을 받고, 여러 개의 값을 return 
//contract선언 후 안에 함수의 선언부만 넣는 형태이다.
contract KittyInterface {
    function getKitty(uint256 _id) external view returns (
      bool isGestating,
      bool isReady,
      uint256 cooldownIndex,
      uint256 nextActionAt,
      uint256 siringWithId,
      uint256 birthTime,
      uint256 matronId,
      uint256 sireId,
      uint256 generation,
      uint256 genes
    );
  }

contract ZombieFeeding is ZombieFactory {

    //함수, require이라는 if문, 아까 정리 못 한 msg.sender라는 내장된 메서드!, 배열의 사용, 
    //Zombie는 구조체 였고 이걸 형이라고 보면 됨. 여기까지는 그냥 선언 또는 포인터라고 볼 수 있다, 그리고 storage나 memory를 통
    //해서 이 값의 영구성/일시성 성질을 부여.
    //public, private / internal, external

    KittyInterface kittyContract;

    //선언 한 interface의 활용, 인자값을 넣었고, kittyContract라는 이름을 지어줫땅
    KittyInterface kittyContract = KittyInterface(ckAddress);


    //onlyOwner 영어 그대로의 제어자
    function setKittyContractAddress(address _address) external onlyOwner{
        kittyContract = KittyInterface(_address);
      }

      function _triggerCooldown(Zombie storage _zombie) internal {
        _zombie.readyTime = uint32(now + cooldownTime);
      }
    
      function _isReady(Zombie storage _zombie) internal view returns (bool) {
          return (_zombie.readyTime <= now);
      }

      
    function feedAndMultiply(uint _zombieId, uint _targetDna, string _species) public {
        require(msg.sender == zombieToOwner[_zombieId]);
        Zombie storage myZombie = zombies[_zombieId];

        _targetDna = _targetDna % dnaModulus;
        uint newDna = (myZombie.dna + _targetDna) / 2;

        //알고 있는 if문
        if (keccak256(_species) == keccak256("kitty")) {
            newDna = newDna - newDna % 100 + 99;
          }

        //함수 호출 후 사용,
        _createZombie("NoName", newDna);

      }

      //아까 선언한 interface의 contract의 함수로 들어가서 그 안에 return 값을 넣는다. 빈 내용만큼 쉼표!
      function feedOnKitty(uint _zombieId, uint _kittyId) public {
        uint kittyDna;
        (,,,,,,,,,kittyDna) = kittyContract.getKitty(_kittyId);
        feedAndMultiply(_zombieId, kittyDna, "kitty");
      }
}




pragma solidity ^0.4.19;
import "./zombiefeeding.sol";
contract ZombieHelper is ZombieFeeding {

    //함수에서 상속? 받아서 확인해 볼 수 있게 modifier로 일단 선언 아마도 middleware?개념이랑 비슷할
  modifier aboveLevel(uint _level, uint _zombieId) {
    require(zombies[_zombieId].level >= _level);
    _;
  }

  //배열 수정!
  function changeName(uint _zombieId, string _newName) external aboveLevel(2, _zombieId) {
    require(msg.sender == zombieToOwner[_zombieId]);
    zombies[_zombieId].name = _newName;
  }

  function changeDna(uint _zombieId, uint _newDna) external aboveLevel(20, _zombieId) {
    require(msg.sender == zombieToOwner[_zombieId]);
    zombies[_zombieId].dna = _newDna;
  }

  //view로 가스절약ㄴ
  function getZombiesByOwner(address _owner) external view returns(uint[]) {

    //선언했떤 mapping이 잘 쓰이고 있당
    //storage 대신 memory, memory로 result 라는 이름의 배열 서넌, 그리고 꼭 해야하는 자료형 표시!, 저 안은 배열 길이
    uint[] memory result = new uint[](ownerZombieCount[_owner]);

    //우리가 쓰던 for문가 if문이 똑같습당
    uint counter = 0;
    for (uint i = 0; i < zombies.length; i++) {
      if (zombieToOwner[i] == _owner) {
        result[counter] = i;
        counter++;
      }
    }
    return result;

}

}


/////////////////////////////




//컨트랙트 불변성 문제 때문에!
function setKittyContractAddress(address _address) external onlyOwner {
    kittyContract = KittyInterface(_address);
  }

  //가S, 수수료 개념!