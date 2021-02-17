import React from 'react';
import {gql} from 'apollo-boost';
import { exp } from 'react-native-reanimated';

export const typedef =gql`
type Comment{
  id   :   Int 
  text :   String
  createdAt:String
  updatedAt:String
  Post :   Post
  PostId :  Int
  User  :  User
  UserId : Int
}
type Post{
  id   :   Int 
  title  :  String
  text :   String
  createdAt:String
  updatedAt:String
  Comment :[Comment]
  UserId : Int
  User: User
  BoardId: Int
  Board: Board
}
type Board {
  id: Int
  type: Int
  Posts: [Post]
  }
type User{
  id: ID!
  password: String
  email: String
  name: String
  grade: Int
  Lectures: [Lecture]
}
type Lecture {
  id: ID!
  name: String
  code: String
  division: String
  subdivision: String
  professer: String
  system: String
  semester: String
  room: String
  classes: [Class]
  users: [User]
  }
type Class {
    id: ID!
    VOD: Boolean
    week: Int
    startTime: String
    endTime: String
    LectureId: Int
    Lecture: Lecture
    }  
`;

export const GET_CONTINENTS = gql`
    query{
        continents{
            code
            name
        }
    }
`;
 
export const  LOGIN = gql`
    mutation login($email: String!, $password: String!){
        login(email: $email, password: $password)
    }
`;

export const GET_USERID = gql`
    query findUserbyName($email: String!){
        findUserbyName(email: $email){
            id
            name
            grade
        }
    }
`;
export const GET_CONTINENT = gql`
query
  findContinent($code: ID!){
    continent(code: $code){
      name
    }
  }
`;

// 2021.01.30 수정됨 (field 추가) 
export const SEE_REGIST_LECTURE = gql`
query {
    seeRegistLecture{
        id
        name
        room
        professer
        code
        division
        subdivision
        system
        classes{
            VOD
            startTime
            endTime
            week
        }
    }
}
`;
export const SEE_REGIST_LECTURE_ONLY = gql`
query {
    seeRegistLecture{
        id
        name
        room
        professer
        code
        division
        subdivision
        system
    }
}
`;

export const SEE_ALL_CLASSES = gql`
query find_classes($LectureId: Int, $week: Int){
    seeAllClasses(LectureId: $LectureId, week: $week){
        VOD
        startTime
        endTime
        LectureId
    }
}
`

export const SEE_ALL_POSTERS = gql`
query see_all($a: Int! ){
    seeAllPost(boardId: $a){
        title
        text
        id
        UserId

    }

}
`;

// 같은 기능인데 꼬일까봐 따로 정의함 
export const SEE_ALL_POST = gql`
    query seeAllPost($boardId: Int){
        seeAllPost(boardId: $boardId){
            id
            title
            text
            updatedAt
            UserId
        }
    }
`

export const POST_VIEW = gql`
query post_view($pid: Int!){
    seeAllComment(postId: $pid){
      text
      id
      UserId
      createdAt
      User{
        name
      }
    }
}
`;

export const POST_INFO = gql `
query postinfo($pid : Int!){
    seePost(postId:$pid){
      id
    }
  }

`;

export const POST_UPLOAD = gql`
mutation upload($bid: Int!, $title:String!, $text:String!){
    createPost(BoardId:$bid ,title:$title , text: $text){
        title
        text
      }
}

`;

export const POST_DELETE = gql`
mutation postdelete($pid: Int!){
    deletePost(PostId:$pid){
      id
    }
  }

`;


export const CREATE_ACCOUNT = gql`
    mutation createAccount($email: String!, $password: String!, $name: String!, $grade: Int, $number: String!){
        createAccount(email: $email, password: $password, name: $name, grade: $grade, number: $number){
            email,
            password,
            name,
            grade,
            number
        }
    }
`;

export const TOGGLE_LECTURE = gql`
    mutation toggleLecture($LectureId: Int!){
        toggleLecture(LectureId: $LectureId){
            id
        }
    }
`;

export const SEE_ALL_LECTURE = gql`
    query{
        seeAllLecture{
            id
            name
            code
            division
            subdivision
            professer
            system
            semester
            room
        }
    }
`;

export const SEARCH_LECTURE = gql`
    query searchLecture($text: String){
        searchLecture(text: $text){
            id
            name
            code
            division
            subdivision
            professer
            system
            semester
            room
            classes{
                VOD
                startTime
                endTime
                week
            }
        }
    }
`

export const POST_LOAD = gql `
query postload($bid: Int!, $snum: Int!, $tnum:Int!){
    loadPost(boardId:$bid, skipNum:$snum, takeNum:$tnum){
      id
      title
      text 
      UserId
      createdAt
      Comment{
        id
        text
        createdAt
        UserId
      }
      User{
        name
      }
  }
}
`;

export const COMMENT_UPLOAD = gql`
mutation commentcreate($pid:Int!, $text:String!){
    createComment(PostId:$pid ,text:$text){
      id
    }
    
  }
`;

export const COMMENT_DELETE = gql`
mutation deletecomment($cid : Int!){
    deleteComment(CommentId:$cid){
      id
    }
  }
`;


export const COMMENT_LOAD = gql`
query commentload($pid:Int!, $snum:Int!, $tnum:Int!){
  loadComment(postId:$pid , skipNum:$snum, takeNum:$tnum){
    text
    id
    UserId
    createdAt
  }
}
`;

//추가
export const SEE_BOARD = gql` 
query {
  seeAllBoard{
    id
    type
    name
  }
}


`;

export const GET_START_DATE = gql`
  query{
    getStartDate{
      startDate
    }
  }
`