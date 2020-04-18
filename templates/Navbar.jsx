import React from 'react';

const Navbar = () => (
    <div>
        <nav className='navbar navbar-expand-lg navbar-dark bg-dark'>
            <a className='navbar-brand' href='/'>Scanner App</a>
            <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbar'>
                <span className='navbar-toggler-icon'></span>
            </button>

            <div className='collapse navbar-collapse' id='navbar'>
                <ul className='navbar-nav ml-auto'>
                    <li className='nav-item'>
                        <a className='nav-link' href='/'>Home</a>
                    </li>
                    <li className='nav-item'>
                        <a className='nav-link' href='/saved'>Saved Scans</a>
                    </li>
                    <li className='nav-item'>
                        <a className='nav-link' href='/admin'>Admin</a>
                    </li>
                </ul>
            </div>
        </nav>
    </div>
);

export default Navbar;