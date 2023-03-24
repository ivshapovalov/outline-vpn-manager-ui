# PHP Outline VPN Server Manager

###This simple repository helps me to manage Outline VPN Servers via Web Browser.  


#### Outline Server Description [`https://getoutline.org`](https://getoutline.org)
#### Outline Server GIT [`https://github.com/Jigsaw-Code/outline-server/`](https://github.com/Jigsaw-Code/outline-server/)

----
###Setup
- shared or VPN hosting with apache and php 7.4 (mysql not needed)
- copy files (mock or stage) to app folder
- run 'composer install' in app folder
- Create secret key
  - use openssl - type in terminal (linux) or git bash (windows): 'openssl rand 512 > secret.key'
  - or you may open file 'secret.key' and use your own blablabla-like random secret string, without using generators;
- open /config/manager.config and change following params
  * SECRET_KEY_FILE='/path/from/app/root/to/your/secret.key'  
  * ADMINS['username']='password' 

----
### MOCK VIEW - https://mockvpn.erepo.ru

### STAGE VIEW

 __Login page__

 <img src="https://user-images.githubusercontent.com/16797864/227714391-b374567f-44ad-4743-8154-be6420b8e6b5.jpg" alt="Login page" title="Login page" width="50%" height="50%">

__Servers page desktop__

 <img src="https://user-images.githubusercontent.com/16797864/227714394-ec20c935-293b-4acd-8966-303fc787bd5a.jpg" alt="Servers page" title="Servers page" >

__Servers page mobile__

 <img src="https://user-images.githubusercontent.com/16797864/227728661-99a41f11-82b2-453f-87d5-611179cbda89.jpg" alt="Servers page" title="Servers page" >

__Server properties page__

 <img src="https://user-images.githubusercontent.com/16797864/227714393-a3a3d470-fbb9-41cc-b0fc-f868cbda8ebc.jpg" alt="Server properties page" title="Server properties page" >

__Keys page desktop__

 <img src="https://user-images.githubusercontent.com/16797864/227714387-82305509-03f8-412c-b243-b5668803203a.jpg" alt="Keys page" title="Keys page" >

__Keys page mobile__

 <img src="https://user-images.githubusercontent.com/16797864/227728658-2a938c1a-01b8-4928-a2a3-fd954fe6641a.jpg" alt="Keys page" title="Keys page" >

__Keys filter and key limit pages__

 <img src="https://user-images.githubusercontent.com/16797864/227714388-52c46905-01c5-4a90-b92c-963519f36637.jpg" alt="Keys filter page" title="Keys filter page"  width="50%" height="50%" >
 <img src="https://user-images.githubusercontent.com/16797864/227714386-7258eaeb-16e7-445c-aefa-86ddd68bdeae.jpg" alt="Keys limit page" title="Keys limit page"  width="25%" height="25%" >

