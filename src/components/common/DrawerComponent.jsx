import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Drawer from "@mui/material/Drawer";
import LoginIcon from '@mui/icons-material/Login';
import TextFieldComponent from "./TextFieldComponent.jsx";
import { useState, useEffect } from "react";
import useCustomLogin from "../../hooks/useCustomLogin.jsx";
import ModalComponent from "./ModalComponent.jsx";
import TextField from "@mui/material/TextField";
import HomeIcon from '@mui/icons-material/Home';
import { Link } from "react-router-dom";
import { getKakaoLink } from "../../api/kakaoApi.js";
import { GridViewStreamIcon } from "@mui/x-data-grid";
import Box from "@mui/material/Box";

const drawerWidth = 240;
const initState = {
  email: '',
  password: ''
};

function DrawerComponent() {
  const [result, setResult] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fail, setFail] = useState(false);
  const { doLogin, doLogout, moveToPath, isLogin, loginState } = useCustomLogin();
  const [user, setUser] = useState(initState);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');  // 로컬 스토리지에서 초기값 설정

  const handleChange = (e) => {
    user[e.target.name] = e.target.value;
    setUser({ ...user });
  };

  const handleClickLogin = () => {
    console.log('로그인 클릭');
    console.log(user);
    doLogin(user)
        .then(data => {
          console.log(data);
          if (data.error) {
            setFail(true);
          } else {
            console.log('로그인 성공');
            setSuccess(true);
            setResult(data.username);
            setUsername(data.username);  // 로그인 성공 시 username 상태 업데이트
            localStorage.setItem('username', data.username);  // 로컬 스토리지에 저장
          }
        });
  };

  const handleClickLogOut = () => {
    doLogout();
    moveToPath('/');
    setUsername('');  // username 초기화
    localStorage.removeItem('username');  // 로컬 스토리지에서 username 제거
  };

  const handleClickText = (e) => {
    const value = e.target.textContent;
    console.log(value);
    if (value === '회원가입') {
      moveToPath('/users/join');
    }
    if (value === 'Home') {
      moveToPath('/');
    }
  };

  const handleClickLink = (link) => {
    window.location.href = link;
  };

  const handleClose = () => {
    if (result) {
      setResult(null);
      moveToPath('/');
    }
    if (fail) {
      setFail(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleClickLogin();
    }
  };

  // `username` 상태가 업데이트되면 Modal이 표시되도록
  useEffect(() => {
    if (username) {
      setSuccess(true);
    }
  }, [username]);

  return (
      <>
        {result ? <ModalComponent
                open={success}
                title={`안녕하세요 ${result}, 님`}
                content={"로그인 하셨습니다."}
                handleClose={handleClose}
            />
            :
            <></>}
        {fail ? <ModalComponent
            open={fail}
            title={`안녕하세요 로그인에 실패하셨습니다`}
            content={'아이디와 비밀번호를 다시 확인해주세요'}
            handleClose={handleClose}
        /> : <></>}
        <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            variant="permanent"
            anchor="right"
        >
          <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
          >
            <List>
              <ListItemButton>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText
                    primary={'Home'}
                    onClick={handleClickText}
                />
              </ListItemButton>
              <ListItemButton onClick={() => handleClickLink('https://exsherpa.com')}>
                <ListItemIcon>
                  <GridViewStreamIcon />
                </ListItemIcon>
                <ListItemText primary={'EX셀파로 이동'} />
              </ListItemButton>
              {!isLogin && (
                  <ListItemButton>
                    <ListItemIcon>
                      <Link to={getKakaoLink()}>
                        <LoginIcon />
                      </Link>
                    </ListItemIcon>
                    <Link
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        to={getKakaoLink()}>
                      <ListItemText
                          primary={'회원가입'}
                      />
                    </Link>
                  </ListItemButton>
              )}
            </List>
            <Divider />
            <List>
              {isLogin ?
                  <>
                    <TextField
                        readOnly
                        margin="dense"
                        id={'loginUserName'}
                        name={'username'}
                        type={'text'}
                        label={'유저명'}
                        value={username}  // username 상태를 여기서 사용
                        fullWidth
                        variant="filled"
                    />
                    <ListItemButton>
                      <ListItemIcon>
                        <LoginIcon
                            onClick={handleClickLogOut} />
                      </ListItemIcon>
                      <ListItemText
                          primary={'로그아웃'}
                          onClick={handleClickLogOut}
                      />
                    </ListItemButton>
                  </>
                  :
                  <>
                    <TextFieldComponent
                        id={'email'}
                        name={'email'}
                        type={'email'}
                        label={'이메일'}
                        value={user.email}
                        handleChange={handleChange}
                        onKeyPress={handleKeyPress}
                    />
                    <TextFieldComponent
                        auto={false}
                        id={'password'}
                        name={'password'}
                        type={'password'}
                        label={'비밀번호'}
                        value={user.password}
                        handleChange={handleChange}
                        onKeyPress={handleKeyPress}
                    />
                    <ListItemButton>
                      <ListItemIcon>
                        <LoginIcon
                            onClick={handleClickLogin}
                        />
                      </ListItemIcon>
                      <ListItemText
                          primary={'로그인'}
                          onClick={handleClickLogin}
                      />
                    </ListItemButton>
                  </>
              }
            </List>
          </Box>
        </Drawer>
      </>
  );
}

export default DrawerComponent;