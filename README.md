# Svelte Clone Coding

- 빌드 환경을 통해 라이브러리가 아닌 컴파일러(트랜스파일러)의 형태로 최소한의 번들 코드를 제공하는 것이 목표
- 스벨트의 기본 문법을 그대로 적용할 것


# Beyond Svelte

##### - 그럼에도 스벨트보다 좋아야 하는 점 

- 더 적은 글자수의 컴파일 결과
- HMR (Hot Module Replacement) 반드시 지원할 것
- 개발환경에서 보다 빠른 빌드 속도를 지원할 것
- $ auto-subscribe의 강화 ($방식도 좋지만 번거로운 코딩이 많다.)
- BEM을 지원하는 class 확장 문법 ex) class:my-video--{focus} 와 같은 축약 기능
- style:background-image|url={src} 와 같은 style directive 제공
- rxjs, typescript를 공식적으로 지원할것
 


# 컴파일러

##### 스크립트 태그

- 대입연산자, 증감연산자의 경우 invalidate({expression}, identifier_flag)
- 블록내의 중복 invalidate 제거
- 태그에서 사용하지 않은 identifier 제거




# 까먹기 전에...

- $if(0, ) .. join("") 을 할떄 이전 path가 '(' 가 아니거나 내가 ')'가 아니면 ','를 붙여 주는 그러한 방식
- if의 경우 DOM를 메모리에 보관해서 DOM을 새로 늘리지 않는 방식을 고민
- 단, if가 destory 될 경우에는 DOM를 초기화 시킬것




 



