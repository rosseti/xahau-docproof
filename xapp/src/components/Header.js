"use client";

import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation'

const Header = () => {
    const { account, logout } = useContext(AppContext);
    const pathname = usePathname();

    const isActive = (name) => pathname.startsWith(name) && pathname !== '/';

    return (
        <header className="navbar bg-base-100 shadow-md">
            <div className="navbar-start">
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16m-7 6h7"
                            />
                        </svg>
                    </label>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
                    >
                    </ul>
                </div>
                
                <a className="btn btn-ghost normal-case text-xl">
                    <img src="/app-logo-horizontal-dark.svg" alt="Xaman Logo" width={160} />
                </a>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <Link className={isActive('/doc/list') ? 'active' : ''} href="/doc/list">
                            My Documents
                        </Link>
                    </li>
                    <li>
                        <Link className={isActive('/doc/create') ? 'active' : ''} href="/doc/create">
                            Send Document
                        </Link>
                    </li>
                    <li>
                        <Link href="https://xaman.app/" target="_blank">
                            Get Xaman App
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="navbar-end">
                {account ? (
                    <button className="btn btn-outline shadow-lg" onClick={() => logout()}>Logout</button>
                ) : ''}
            </div>
        </header>
        
    );
};

export default Header;
