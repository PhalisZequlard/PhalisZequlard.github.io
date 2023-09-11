
// 設置 cookie
function setCookie(name, value, minutes) {
  const expires = new Date(new Date().getTime() + minutes * 60 * 1000);
  document.cookie = name + "=" + value + "; expires=" + expires.toUTCString() + "; path=/";
}

// header
document.addEventListener('DOMContentLoaded', function() {
  // 讀取 cookie
  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // 檢查是否有 lastVisit cookie
  const lastVisit = getCookie('lastVisit');

  // 獲取當前時間
  const currentTime = new Date().getTime();

  // 檢查是否在10分鐘內重複訪問
  if (lastVisit && currentTime - lastVisit < 10 * 60 * 1000) {
    // 在10分鐘內重複訪問，直接移除 header
    const header = document.querySelector('header');
    header.remove();
    document.body.classList.remove('no-scroll');
  } else {
    // 超過10分鐘或首次訪問，顯示 header 動畫
    const header = document.querySelector('header');
    header.addEventListener('click', function() {
      header.style.opacity = '0';
      document.body.classList.remove('no-scroll');
      setTimeout(() => {
        header.remove();
      }, 1000);
    });
  }

  // 更新 lastVisit 時間
  setCookie('lastVisit', currentTime, 1);  // 1分鐘後過期
});



import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
const firebaseConfig = {
  apiKey: "AIzaSyC2wGJaAsQTdMP6VOiVtAl4DGlToiSvwSY",
  authDomain: "nomadic-bison-390822.firebaseapp.com",
  databaseURL: "https://nomadic-bison-390822-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "nomadic-bison-390822",
  storageBucket: "nomadic-bison-390822.appspot.com",
  messagingSenderId: "128137030974",
  appId: "1:128137030974:web:9747a3640eae3d445cd06f",
  measurementId: "G-GN70PHQBBG"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const msgRef = ref(database, "/user/");
let currentUsername = null;
const fetchMessages = async () => {
  try {
    const messagesSnapshot = await get(msgRef);
    if (messagesSnapshot.exists()) {
      const messages = messagesSnapshot.val();
      $("#msgList").empty();
      for (const username in messages) {
        // 檢查msg、loby和text欄位是否存在
        if (messages[username].msg && messages[username].msg.loby && messages[username].msg.loby.text) {
          $("#msgList").append(`
            <li>
              <h4>${username}</h4>
              <p>${messages[username].msg.loby.text}</p>
            </li>
          `);
        } else {
          console.log(`user: ${username} have no messages.`);
        }
      }
    } else {
      console.log("No messages found");
    }
  } catch (error) {
    console.error("Failed to fetch messages:", error);
  }
};

fetchMessages();

const restaurantRef = ref(database, "/restaurant/");
const fetchRestaurants = async () => {
  const restaurantSnapshot = await get(restaurantRef);
  const restaurants = restaurantSnapshot.val();
  for (const restaurantName in restaurants) {
    const rate = restaurants[restaurantName].rate;
    const waitfor = restaurants[restaurantName].waitfor;
    const foodimg = restaurants[restaurantName].foodimg;

    const restaurantBox = `
      <div class="box">
        <div class="img" style="background: url(${foodimg});background-size: cover;background-position: center;"></div>
        <div class="txt">
          <div>
            <h4>${restaurantName}</h4>
            <p>0$ 外送費・${waitfor} min</p>
          </div>
          <p>${rate}</p>
        </div>
      </div>
    `;
    // $("#restaurantContainer").append(restaurantBox);  


    // 創建一個 jQuery 物件
    const $restaurantBox = $(restaurantBox);
    // 添加點擊事件監聽器
    $restaurantBox.on("click", function() {
      console.log("Setting cookies for restaurant:", restaurantName); // 調試
      setCookie("selectedRestaurantName", restaurantName, 60);  // 儲存60分鐘
      // setCookie("selectedFoodImg", foodimg, 60);  
      // setCookie("selectedRate", rate, 60);        
      // setCookie("selectedWaitFor", waitfor, 60);  
      window.location.href = "testing_order.html";
    });
    // 添加到容器
    $("#restaurantContainer").append($restaurantBox);
  }
};



// 在適當的地方調用 fetchMessages 函數
$(document).ready(function(){
  fetchRestaurants();
  $("#addRestaurant").click(async function() {
    const name = $("#name").val();
    const foodimg = $("#foodimg").val();
    const rate = $("#rate").val();
    const waitfor = $("#waitfor").val();

    if (name && rate && waitfor) {
      const newRestaurantRef = ref(database, `/restaurant/${name}`);
      await set(newRestaurantRef, {
        foodimg: foodimg,
        rate: rate,
        waitfor: waitfor
      });
      fetchRestaurants();
    } else {
      alert("所有欄位都是必填的！");
    }
  });


  // 新增訊息
  $("#btn").click(async function() {
    const svgElement = $("#btn > svg");
    const svgElementPath = $("#btn > svg > path");
    if (currentUsername) {
      const userMsgRef = ref(database, `/user/${currentUsername}/msg/loby`);
      var msg = $("#input").val();
      console.log(msg);

      if (msg && msg.length <= 25) {  // 檢查訊息是否為空或超過25字
        await set(userMsgRef, {
          text: msg
        });
        fetchMessages();
        // 清空<input>元素
        $("#input").val('');
        svgElementPath.addClass("green");
        setTimeout(() => {
          svgElementPath.removeClass("green");
        }, 800);
      } else {
        svgElement.addClass("shake");
        svgElementPath.addClass("red");
        setTimeout(() => {
          svgElement.removeClass("shake");
        }, 300);
        setTimeout(() => {
          svgElementPath.removeClass("red");
        }, 600);
      }
    } else {
      console.error("User is not logged in");
    }
  });


  // 動態生成下拉選單選項
  async function populateRestaurantDropdown() {
    const restaurantRef = ref(database, '/restaurant');
    const snapshot = await get(restaurantRef);
    const data = snapshot.val();
    let options = '';
    for (const name in data) {
      options += `<option value="${name}">${name}</option>`;
    }
    $("#existingRestaurants").html(options);
  }
  // 獲取選定店家的資訊並填充到表單中
  $("#fetchRestaurantInfo").click(async function() {
    const selectedRestaurant = $("#existingRestaurants").val();
    const restaurantRef = ref(database, `/restaurant/${selectedRestaurant}`);
    const snapshot = await get(restaurantRef);
    const data = snapshot.val();
    $("#name").val(selectedRestaurant);
    $("#foodimg").val(data.foodimg);
    $("#rate").val(data.rate);
    $("#waitfor").val(data.waitfor);
  });
  populateRestaurantDropdown();  // 初始化下拉選單


  $("#input").on("input", function() {
    const currentLength = $(this).val().length;
    $("#charCount").text(`${currentLength}/25`);
    if (currentLength > 25) {
      $("#charCount").css("color", "rgb(215, 25, 25)");
    } else {
      $("#charCount").css("color", "black");
    }
  });
});

// Google Login
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Google帳號登入介面
$("#loginbutton, #googleLoginBtn").click(function() {
  window.location.href = "testing_login.html";
});
// 登出功能
$("#googleLogoutBtn").click(function() {
  signOut(auth).catch((error) => {
    console.error(error);
  });
  window.location.href = "testing.html";
});

// 監聽身份驗證狀態的更改
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // 將用戶的uid寫入資料庫
    const userRef = ref(database, `user/${user.displayName}/uid`);
    set(userRef, user.uid);
    // 用戶已登入
    currentUsername = user.displayName || user.email;
    $("#googleLoginBtn").hide();
    $("#googleLogoutBtn").show();
    $(".noLogin").hide();
    $(".loginOnly").show();
    fetchMessages();

    try {
      // 嘗試檢查是否是管理員
      const adminRef = ref(database, `/admins/${user.uid}`);
      const snapshot = await get(adminRef);
      if (snapshot.exists()) {
        // 用戶是管理員，顯示所有 class="adminOnly" 的元素
        $(".adminOnly").show();
      } else {
        // 用戶不是管理員，刪除所有 class="adminOnly" 的元素
        $(".adminOnly").remove();
      }
    } catch (error) {
      if (error.message === "Permission denied") {
        // 訪問被拒絕，用戶不是管理員
        $(".adminOnly").remove();
      } else {
        console.error("檢查管理員狀態失敗：", error);
      }
    }
  } else {
    // 用戶已登出
    currentUsername = null;
    $("#googleLoginBtn").show();
    $("#googleLogoutBtn").hide();
    $(".adminOnly").remove();
    $(".noLogin").show();
    $(".loginOnly").remove();
  }
});
