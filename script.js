var popupDiv = document.getElementById("div_popup");
var popupDiv2 = document.getElementById("div_popup2");
var bodyDiv = document.getElementById("div_bodycontent");
var reselectButton = document.getElementById("reselectbutton");
var logoutButton = document.getElementById("logoutbutton");
var searchButton = document.getElementById("searchbutton");
var searchBar = document.getElementById("searchbar");
var messageBox = document.getElementById("messagebox");
var message = document.getElementById("message");

function showMessage(themessage) {
    message.innerText = themessage;
    messageBox.style.display = "flex";
}

function hideMessage() {
    message.innerText = "";
    messageBox.style.display = "none";
}

function closePopupdiv2() {
    hideMessage();
    popupDiv2.style.display = "none";
    popupDiv2.innerHTML = "";
}

function closePopupdiv() {
    hideMessage();
    popupDiv.style.display = "none";
    popupDiv.innerHTML = "";
}

function login() {
    // get values from input fields
    var username = document.getElementById("username_field").value;
    var password = document.getElementById("password_field").value;

    // make POST request to URL with username and password
    fetch('https://plex.tv/users/sign_in.json?user[password]=' + encodeURIComponent(password) + '&user[login]=' + encodeURIComponent(username), {
            method: 'POST',
            headers: {
                'X-Plex-Version': '4.99.2',
                'X-Plex-Product': 'Plex Web',
                'X-Plex-Client-Identifier': 'fsafhjsdlkfhsfdhkshf7',
            }
        })
        .then(response => response.json())
        .then(data => {
            showMessage("try to login as '" + username + "'")
                // extract token from JSON response
            var token = data['user']['authToken'];
            //console.log(data)
            // make GET request with token
            fetch('https://plex.tv/api/v2/resources', {
                    method: 'GET',
                    headers: {
                        'X-Plex-Version': '4.99.2',
                        'X-Plex-Product': 'Plex Web',
                        'X-Plex-Client-Identifier': 'fsafhjsdlkfhsfdhkshf7',
                        'X-Plex-Token': token
                    }
                })
                .then(response => response.text())
                .then(data => {
                    // parse XML data
                    //console.log(data)
                    var parser = new DOMParser();
                    var xml = parser.parseFromString(data, "text/xml");
                    var soerver = [];
                    // log values to console
                    var servers = xml.getElementsByTagName("resource");
                    if (servers.length < 1) {
                        console.error("no media shares connected to your account")
                        showMessage("successfully logged in but your account has no media shares")
                        logout();
                        return;
                    } else {
                        localStorage.setItem("login", true);
                    }
                    for (let i = 0; i < servers.length; i++) {
                        var server_array = {};
                        if (servers[i].getAttribute('product') === "Plex Media Server") {
                            server_array['name'] = servers[i].getAttribute('name')
                            server_array['token'] = servers[i].getAttribute('accessToken')
                                //console.log(servers[i].getAttribute('name'))
                            var connection_array = {};
                            var connections = servers[i].getElementsByTagName("connection");
                            for (let j = 0; j < connections.length; j++) {
                                //console.log(connections[j].getAttribute('protocol'))
                                connection_array[j] = connections[j].getAttribute('uri')
                            }
                            server_array['connections'] = connection_array
                            soerver.push(server_array)
                        }
                    }
                    //console.log(server_array);
                    localStorage.setItem('servers', JSON.stringify(soerver))
                    window.location.reload();
                    showMessage("successfully logged in as " + username + "'")
                })
                .catch(error => {
                    showMessage("cannot get data from account")
                    console.error("cannot get account data: " + error)
                })
        })
        .catch(error => {
            showMessage("wrong credentials")
            console.error("wrong credentials: " + error)
        })
}

function logout() {
    try {
        localStorage.clear()
        showMessage("logged out successfully")
        window.location.reload();
    } catch {
        showMessage("something went wrong with logging out")
        console.error("something went wrong. please delete all your browser data to log out")
    }

}

function selectSelected(url, token) {
    showMessage("trying to connect... please wait!");
    fetch(url + '/search?query=&X-Plex-Token=' + token, {
            method: 'GET',
        })
        .then(response => response.text())
        .then(data => {
            showMessage("connected successfully");
            console.log("your selected server is " + url + " and your token is " + token);
            localStorage.setItem('selected', true)
            localStorage.setItem('selected_url', url);
            localStorage.setItem('selected_token', token);
            window.location.reload();
        })
        .catch(error => {
            showMessage("cannot connect");
            console.error("cannot connect: " + error)
        });
}


function searcher() {
    showMessage("started search. please wait!");
    bodyDiv.innerHTML = '';
    // get values from input fields
    var search_string = document.getElementById("searchbar").value;
    console.log("search for '" + search_string + "' started")
    fetch(localStorage.getItem('selected_url') + "/search?query=" + encodeURIComponent(search_string) + "&X-Plex-Token=" + localStorage.getItem('selected_token'), {
            method: 'GET'
        })
        .then(response => response.text())
        .then(data => {
            hideMessage();
            console.log("fetched the data")
            bodyDiv.innerHTML = ""
            var emptyKey = { not_key: undefined };
            var searchResultDict = {};
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            //console.log(xml);
            var searchResultMovies = xml.getElementsByTagName("Video");
            var searchResultShows = xml.getElementsByTagName("Directory");
            var searchResults = [searchResultMovies, searchResultShows]
                //console.log(searchResult);
                //console.log(searchResult);
                //console.log(searchResult.length);
            if (searchResultMovies.length < 1 && searchResultShows.length < 1) {
                showMessage("no search results");
                console.error("no media shares connected to your account or no search results found")
                return;
            } else {
                for (let j = 0; j < searchResults.length; j++) {
                    var searchResult = searchResults[j];
                    for (let i = 0; i < searchResult.length; i++) {
                        var temp1 = searchResult[i].getAttribute('type');
                        if (temp1 == "movie" || temp1 == "show") {
                            //console.log(searchResult[i])
                            var temp2 = searchResult[i].getAttribute('guid')
                                //temp_data_processor['id'] = searchResult[i].getAttribute('grandparentGuid');
                            if (!(temp2 in searchResultDict)) {
                                searchResultDict[temp2] = {};
                                searchResultDict[temp2]['title'] = searchResult[i].getAttribute('title');
                                searchResultDict[temp2]['type'] = searchResult[i].getAttribute('type');
                                searchResultDict[temp2]['year'] = searchResult[i].getAttribute('year');
                                searchResultDict[temp2]['summary'] = searchResult[i].getAttribute('summary');
                                searchResultDict[temp2]['duration'] = Math.round(parseInt(searchResult[i].getAttribute('duration')) / 1000 / 60);
                                searchResultDict[temp2]['audienceRating'] = searchResult[i].getAttribute('audienceRating');
                                searchResultDict[temp2]['thumb'] = searchResult[i].getAttribute('thumb');
                                searchResultDict[temp2]['art'] = searchResult[i].getAttribute('art');
                                var genres = searchResult[i].getElementsByTagName("Genre");
                                searchResultDict[temp2]['genres'] = [];
                                for (let y = 0; y < genres.length; y++) {
                                    searchResultDict[temp2]['genres'].push(genres[y].getAttribute('tag'));
                                    //console.log(genres[y].getAttribute('tag'));
                                }
                                searchResultDict[temp2]['files'] = [];
                            } else {
                                //check if every value is available
                                var thingsToGet = ["title", "type", "year", "summary", "duration", "audienceRating", "thumb", "art"]
                                for (const element of thingsToGet) {
                                    if (searchResultDict[temp2][element] == undefined || searchResultDict[temp2][element] == null) {
                                        searchResultDict[temp2][element] = searchResult[i].getAttribute(element);
                                    }
                                }
                            }
                            //get all downloads
                            var temp_data_processor = {};
                            temp_data_processor['library'] = searchResult[i].getAttribute('librarySectionTitle');
                            temp_data_processor['key'] = searchResult[i].getAttribute('key');
                            searchResultDict[temp2]['files'].push(temp_data_processor);
                        }
                    }




                }
            }
            //console.log(searchResultDict);
            //display results in html
            console.log("processing the data")
            for (let i = 0; i < Object.keys(searchResultDict).length; i++) {
                momObj = Object.values(searchResultDict)[i]


                var div_mediaCard = document.createElement('div');
                div_mediaCard.className = 'div_mediaCard';

                //var thisisithahahaha = document.createElement('thisisithahahaha');
                //thisisithahahaha.className = 'thisisithahahaha';

                //console.log(momObj)

                //add image
                var div_mediaCard_upper = document.createElement('div');
                div_mediaCard_upper.className = 'div_mediaCard_upper';
                var div_mediaCard_Image = document.createElement('div');
                div_mediaCard_Image.className = 'div_mediaCard_Image';
                var img_mediaCard_Image = document.createElement('img');
                img_mediaCard_Image.className = 'img_mediaCard_Image';
                img_mediaCard_Image.alt = 'cover';
                img_mediaCard_Image.src = localStorage.getItem("selected_url") + momObj['thumb'] + "?X-Plex-Token=" + localStorage.getItem("selected_token");
                div_mediaCard_Image.appendChild(img_mediaCard_Image);
                div_mediaCard_upper.append(div_mediaCard_Image);

                //add title
                var div_mediaCard_Info = document.createElement('div');
                div_mediaCard_Info.className = 'div_mediaCard_Info';
                var div_mediaCard_Title = document.createElement('div');
                div_mediaCard_Title.className = 'div_mediaCard_Title';
                var p_mediaCard_Title = document.createElement('p');
                p_mediaCard_Title.className = 'p_mediaCard_Title';
                p_mediaCard_Title.title = momObj['title'];
                p_mediaCard_Title.appendChild(document.createTextNode(momObj['title']));
                div_mediaCard_Title.appendChild(p_mediaCard_Title);
                div_mediaCard_Info.appendChild(div_mediaCard_Title);

                //add subline
                var div_mediaCard_Info_General = document.createElement('div');
                div_mediaCard_Info_General.className = 'div_mediaCard_Info_General';
                var p_mediaCard_Info_General = document.createElement('p');
                p_mediaCard_Info_General.className = 'p_mediaCard_Info_General';
                p_mediaCard_Info_General.appendChild(document.createTextNode(momObj['year'] + " • " + momObj['genres'] + " • " + Math.floor(momObj['duration'] / 60) + "h " + momObj['duration'] % 60 + "min"));
                div_mediaCard_Info_General.appendChild(p_mediaCard_Info_General);
                div_mediaCard_Info.appendChild(div_mediaCard_Info_General);

                //add download links
                var div_mediaCard_Info_lower = document.createElement('div');
                div_mediaCard_Info_lower.className = 'div_mediaCard_Info_lower';
                var div_mediaCard_Info_lower_Specific = document.createElement('div');
                div_mediaCard_Info_lower_Specific.className = 'div_mediaCard_Info_lower_Specific';
                for (let j = 0; j < momObj['files'].length; j++) {
                    var div_mediaCard_Info_lower_Specific_under = document.createElement('div');
                    div_mediaCard_Info_lower_Specific_under.className = 'div_mediaCard_Info_lower_Specific_under';
                    var a_mediaCard_Info_lower_Specific = document.createElement('a');
                    a_mediaCard_Info_lower_Specific.className = 'a_mediaCard_Info_lower_Specific';
                    a_mediaCard_Info_lower_Specific.appendChild(document.createTextNode(momObj['files'][j]['library']));
                    if (momObj['type'] == 'movie') {
                        a_mediaCard_Info_lower_Specific.setAttribute("onclick", "downloadMovie('" + momObj['files'][j]['key'] + "');");;
                    } else if (momObj['type'] == 'show') {
                        a_mediaCard_Info_lower_Specific.setAttribute("onclick", "downloadShow('" + momObj['files'][j]['key'] + "');");;
                    }
                    div_mediaCard_Info_lower_Specific_under.appendChild(a_mediaCard_Info_lower_Specific);
                    div_mediaCard_Info_lower_Specific.appendChild(div_mediaCard_Info_lower_Specific_under);
                }

                div_mediaCard_Info_lower.appendChild(div_mediaCard_Info_lower_Specific);
                div_mediaCard_Info.appendChild(div_mediaCard_Info_lower);


                //add rating
                var div_mediaCard_Info_lower_rating = document.createElement('div');
                div_mediaCard_Info_lower_rating.className = 'div_mediaCard_Info_lower_rating';
                var div_mediaCard_Info_lower_rating_inner = document.createElement('div');
                div_mediaCard_Info_lower_rating_inner.className = 'div_mediaCard_Info_lower_rating_inner';
                var p_mediaCard_Info_lower_rating = document.createElement('p');
                p_mediaCard_Info_lower_rating.className = 'p_mediaCard_Info_lower_rating';
                p_mediaCard_Info_lower_rating.appendChild(document.createTextNode(momObj['audienceRating']));
                if (momObj['audienceRating'] > 7.9) {
                    p_mediaCard_Info_lower_rating.classList.add("good")
                } else if (momObj['audienceRating'] > 5.9) {
                    p_mediaCard_Info_lower_rating.classList.add("okay")
                } else if (momObj['audienceRating'] > 4.9) {
                    p_mediaCard_Info_lower_rating.classList.add("bad")
                } else {
                    p_mediaCard_Info_lower_rating.classList.add("worst")
                }
                div_mediaCard_Info_lower_rating_inner.appendChild(p_mediaCard_Info_lower_rating);
                div_mediaCard_Info_lower_rating.appendChild(div_mediaCard_Info_lower_rating_inner);
                div_mediaCard_Info_lower.appendChild(div_mediaCard_Info_lower_rating);
                div_mediaCard_Info.appendChild(div_mediaCard_Info_lower);

                //add summary
                var div_mediaCard_lower = document.createElement('div');
                div_mediaCard_lower.className = 'div_mediaCard_lower';
                var div_mediaCard_lower_summary = document.createElement('div');
                div_mediaCard_lower_summary.className = 'div_mediaCard_lower_summary';
                var p_mediaCard_lower_summary = document.createElement('p');
                p_mediaCard_lower_summary.className = 'p_mediaCard_lower_summary';
                var temp_summary = "no summary"
                if (momObj['summary'].length > 150) {
                    var temp_summary = momObj['summary'].substring(0, 150) + '...';
                } else {
                    var temp_summary = momObj['summary']
                }
                p_mediaCard_lower_summary.appendChild(document.createTextNode(momObj['summary']));
                div_mediaCard_lower_summary.appendChild(p_mediaCard_lower_summary);
                div_mediaCard_lower.append(div_mediaCard_lower_summary);

                div_mediaCard_upper.append(div_mediaCard_Info);
                div_mediaCard.append(div_mediaCard_upper);
                div_mediaCard.append(div_mediaCard_lower);
                bodyDiv.appendChild(div_mediaCard);
            }
        })
        .catch(error => {
            showMessage("error with parsing the data");
            console.error("error with parsing xml: " + error)
        })
}

function reselect() {
    localStorage.removeItem('selected');
    window.location.reload();
}

function downloadMovie(key) {
    showMessage("getting movie download url");
    popupDiv.innerHTML = ""
    fetch(localStorage.getItem('selected_url') + key + "?X-Plex-Token=" + localStorage.getItem('selected_token'), {
            method: 'GET'
        })
        .then(response => response.text())
        .then(data => {
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            //console.log(xml);
            var elementInfo = xml.getElementsByTagName("Part");
            var elementFile = encodeURI(/[^/]*$/.exec(elementInfo[0].getAttribute("file"))[0]);
            //console.log(/[^/]*$/.exec(elementInfo[0].getAttribute("file"))[0])
            var elementKey = /^(.*[\/])/.exec(elementInfo[0].getAttribute("key"))[1];
            var downloadurl = localStorage.getItem("selected_url") + elementKey + elementFile + "?download=0&X-Plex-Token=" + localStorage.getItem("selected_token")
                //console.log(downloadurl);
            popupDiv.innerHTML = `<div class="div_download_section">
                <div class="div_download_section_inner">
                <a class="closebutton" onclick="closePopupdiv()">x</a>
                    <input id="input_download_section_inner" class="input_download_section_inner" type="text" value="` + downloadurl + `" disabled="disabled">
                    <a href="` + downloadurl + `" class="downloadbutton">download</a>
                    </div>
            </div>`
            popupDiv.style.display = "flex";
            bodyDiv.appendChild(popupDiv);
            //console.log(popupDiv);
            var downloadInput = document.getElementById('input_download_section_inner')
                //console.log(downloadInput)
            downloadInput.focus()
            downloadInput.select();
            navigator.clipboard.writeText(downloadurl);
            showMessage("the url is now in your clipboard");
            //downloadButton.setAttribute("download", "test");
        })
        .catch(error => {
            showMessage("failed to fetch downlaod url");
            console.error("didn't get any information from the specific file: " + error)
        })
}

function downloadEpisode(key) {
    showMessage("getting tv show download url");
    console.log(key)
    fetch(localStorage.getItem('selected_url') + key + "?X-Plex-Token=" + localStorage.getItem('selected_token'), {
            method: 'GET'
        })
        .then(response => response.text())
        .then(data => {
            hideMessage();
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            //console.log(xml);
            var elementInfo = xml.getElementsByTagName("Part");
            var elementFile = encodeURI(/[^/]*$/.exec(elementInfo[0].getAttribute("file"))[0]);
            var elementKey = /^(.*[\/])/.exec(elementInfo[0].getAttribute("key"))[1];
            var downloadurl = localStorage.getItem("selected_url") + elementKey + elementFile + "?download=0&X-Plex-Token=" + localStorage.getItem("selected_token")
                //console.log(downloadurl);
            popupDiv2.innerHTML = `<div class="div_download_section">
            <div class="div_download_section_inner">
            <a class="closebutton" onclick="closePopupdiv2()">x</a>
                <input id="input_download_section_inner" class="input_download_section_inner" type="text" value="` + downloadurl + `" disabled="disabled">
                <a href="` + downloadurl + `" class="downloadbutton">download</a>
                </div>
        </div>`
            popupDiv2.style.display = "flex";
            bodyDiv.appendChild(popupDiv2);
            //console.log(popupDiv);
            var downloadInput = document.getElementById('input_download_section_inner')
                //console.log(downloadInput)
            downloadInput.focus()
            downloadInput.select();
            navigator.clipboard.writeText(downloadurl);
            showMessage("the downlaod url is now in your clipboard");
            //downloadButton.setAttribute("download", "test");
        })
        .catch(error => {
            showMessage("cannot fetch download url");
            console.error("didn't get any information from the specific file: " + error)
        })
}

function downloadSeason(key) {
    showMessage("getting episodes");
    //console.log(key)
    popupDiv.innerHTML = ""
    fetch(localStorage.getItem('selected_url') + key + "?X-Plex-Token=" + localStorage.getItem('selected_token'), {
            method: 'GET'
        })
        .then(response => response.text())
        .then(data => {
            hideMessage();
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            //console.log(xml);
            //get seasons
            var elementInfo = xml.getElementsByTagName("Video");
            //console.log(elementInfo)
            var episodeList = [];
            for (let i = 0; i < elementInfo.length; i++) {
                console.log(elementInfo[i]);
                var temp1 = elementInfo[i].getAttribute('type');
                if (temp1 == "episode") {
                    var tempEpisode = {};
                    console.log(elementInfo[i])
                    tempEpisode['title'] = elementInfo[i].getAttribute('title')
                    tempEpisode['key'] = elementInfo[i].getAttribute('key')
                        //console.log(elementInfo[i].getAttribute('title'))
                        //console.log(elementInfo[i].getAttribute('key'))
                    episodeList.push(tempEpisode);
                }
            }
            console.log(episodeList);
            //display episodes
            var mediaSelector = document.createElement('div');
            mediaSelector.className = 'div_mediaSelector';
            var closeButton = document.createElement('a');
            closeButton.className = 'closebutton';
            closeButton.innerText = "x";
            closeButton.setAttribute("onclick", "closePopupdiv()");
            mediaSelector.appendChild(closeButton)
            for (let i = 0; i < Object.keys(episodeList).length; i++) {
                console.log(episodeList[i]['title'])
                var mediaSelectorSpecific = document.createElement('div');
                mediaSelectorSpecific.className = 'div_mediaSelector_specific';
                var a_mediaSelector = document.createElement('a');
                a_mediaSelector.className = 'a_mediaSelector';
                a_mediaSelector.innerText = episodeList[i]['title'];
                a_mediaSelector.setAttribute("onclick", "downloadEpisode('" + episodeList[i]['key'] + "');");;
                mediaSelectorSpecific.appendChild(a_mediaSelector);
                mediaSelector.appendChild(mediaSelectorSpecific);
            }
            popupDiv.appendChild(mediaSelector);
            bodyDiv.appendChild(popupDiv);
        })
        .catch(error => {
            showMessage("failed to fetch episodes");
            console.error("didn't get any information from the specific file: " + error)
        })
}

function downloadShow(key) {
    showMessage("getting seasons");
    popupDiv.innerHTML = '';
    fetch(localStorage.getItem('selected_url') + key + "?X-Plex-Token=" + localStorage.getItem('selected_token'), {
            method: 'GET'
        })
        .then(response => response.text())
        .then(data => {
            hideMessage();
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            //console.log(xml);
            //get seasons
            var elementInfo = xml.getElementsByTagName("Directory");
            //console.log(elementInfo)
            var seasonList = [];
            for (let i = 0; i < elementInfo.length; i++) {
                //console.log(elementInfo[i]);
                var temp1 = elementInfo[i].getAttribute('type');
                if (temp1 == "season") {
                    var tempSeason = {};
                    tempSeason['title'] = elementInfo[i].getAttribute('title')
                    tempSeason['key'] = elementInfo[i].getAttribute('key')
                        //console.log(elementInfo[i].getAttribute('title'))
                        //console.log(elementInfo[i].getAttribute('key'))
                    seasonList.push(tempSeason);
                }
            }
            //console.log(seasonList);
            //display seasons
            var mediaSelector = document.createElement('div');
            mediaSelector.className = 'div_mediaSelector';
            var closeButton = document.createElement('a');
            closeButton.className = 'closebutton';
            closeButton.innerText = "x";
            closeButton.setAttribute("onclick", "closePopupdiv()");
            mediaSelector.appendChild(closeButton)
            for (let i = 0; i < Object.keys(seasonList).length; i++) {
                //console.log(seasonList[i]['title'])
                var mediaSelectorSpecific = document.createElement('div');
                mediaSelectorSpecific.className = 'div_mediaSelector_specific';
                var a_mediaSelector = document.createElement('a');
                a_mediaSelector.className = 'a_mediaSelector';
                a_mediaSelector.innerText = seasonList[i]['title'];
                a_mediaSelector.setAttribute("onclick", "downloadSeason('" + seasonList[i]['key'] + "');");;
                mediaSelectorSpecific.appendChild(a_mediaSelector);
                mediaSelector.appendChild(mediaSelectorSpecific);
            }
            popupDiv.appendChild(mediaSelector);
            popupDiv.style.display = "flex";
            bodyDiv.appendChild(popupDiv);
        })
        .catch(error => {
            showMessage("failed to fetch seasons");
            console.error("didn't get any information from the specific file: " + error)
        })
}

$(document).ready(function() {
    popupDiv.style.display = "none";
    popupDiv2.style.display = "none";
    //console.log(localStorage.getItem("login"))
    if (localStorage.getItem("login") === null) {
        reselectButton.classList.add("disabled");
        logoutButton.classList.add("disabled");
        searchBar.classList.add("disabled");
        searchBar.disabled = true;
        searchButton.disabled = true;
        popupDiv.innerHTML = `<div class="div_login">
            <form class="loginform" action="#" onsubmit="login();return false">
                    <input class="logininput" name="uname" type="text" placeholder="Plex Username" id="username_field" required>
                    <input class="logininput" name="pword" type="password" placeholder="Plex Password" id="password_field" required>
                    <button class="loginbutton" type=”submit” onclick="login()">Submit</button>
            </form>
        </div>`
        popupDiv.style.display = "flex";
    } else if (localStorage.getItem("selected") === null) {
        reselectButton.classList.add("disabled");
        searchBar.classList.add("disabled");
        searchBar.disabled = true;
        searchButton.disabled = true;
        var popupTitle = document.createElement('p');
        popupTitle.className = 'p_popup_title';
        popupTitle.innerHTML = "Select a Connection";
        popupDiv.appendChild(popupTitle);
        var serversToChoose = JSON.parse(localStorage.getItem("servers"))
        for (let i = 0; i < serversToChoose.length; i++) {
            var div1 = document.createElement('div');
            div1.className = 'div_selectserver';
            var server_name = document.createElement('p');
            server_name.className = 'p_selectserver_title';
            server_name.innerHTML = serversToChoose[i]['name'];
            div1.appendChild(server_name);
            //console.log(serversToChoose[i]['name'])
            for (let j = 0; j < Object.entries(serversToChoose[i]["connections"]).length; j++) {
                var server_url = document.createElement('a');
                server_url.className = 'p_selectserver_url';
                server_url.setAttribute("onclick", "selectSelected('" + serversToChoose[i]['connections'][j] + "','" + serversToChoose[i]['token'] + "')");
                server_url.innerHTML = serversToChoose[i]["connections"][j];
                //console.log("i :" + i + ", j: " + j)
                //console.log(serversToChoose[i]["connections"][j])
                div1.appendChild(server_url);
            }
            //console.log(div1)
            popupDiv.appendChild(div1);
        }
        popupDiv.style.display = "flex";
    } else {
        console.log("nothing")
    }
});