import React, { useState, useEffect } from "react";
import { from, BehaviorSubject } from "rxjs";
import {
    filter,
    distinctUntilChanged,
    debounceTime,
    mergeMap,
} from "rxjs/operators";

import "./search-form.scss";

// this doesn't update the search input
function UserResult({ login, avatar_url, updateSearch }) {
    const handleClick = e => {
        updateSearch.next(e.currentTarget.innerText.trim());
    };

    return (
        <li>
            <img
                src={avatar_url}
                style={{ width: "40px", height: "40px" }}
                alt={login}
            />{" "}
            <span
                style={{
                    textDecoration: "underline",
                    color: "blue",
                    cursor: "pointer",
                }}
                onClick={handleClick}
            >
                {login}
            </span>
        </li>
    );
}

const getGithubFollowers = async username => {
    const followers = await fetch(
        `https://api.github.com/users/${username}/followers`
    ).then(res => res.json());
    return followers;
};

let searchSubject = new BehaviorSubject("");
let searchResultObservable = searchSubject.pipe(
    filter(val => val.length > 1),
    debounceTime(750),
    distinctUntilChanged(),
    mergeMap(val => from(getGithubFollowers(val)))
);

const useObservable = (observable, setter) => {
    useEffect(() => {
        let subsription = observable.subscribe(result => {
            setter(result);
        });

        return () => subsription.unsubscribe();
    }, [observable, setter]);
};

const SearchForm = () => {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);

    useObservable(searchResultObservable, setResults);

    const handleSearchChange = e => {
        const newValue = e.target.value;
        setSearch(newValue);
        searchSubject.next(newValue);
    };

    return (
        <>
            <h2>Get Github Followers</h2>
            <form>
                <input
                    type="text"
                    placeholder="Github username"
                    value={search}
                    onChange={handleSearchChange}
                />
            </form>
            <div className="results">
                <ol>
                    {results.length > 0
                        ? results.map(r => (
                              <UserResult
                                  key={r.id}
                                  login={r.login}
                                  avatar_url={r.avatar_url}
                                  updateSearch={searchSubject}
                              />
                          ))
                        : null}
                </ol>
            </div>
        </>
    );
};

export default SearchForm;
