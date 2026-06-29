<?php

/** @var \Core\Router $router */

$router->add('GET',  '/ping',                'AuthController', 'ping');
$router->add('POST', '/auth/login',          'AuthController', 'login');
$router->add('POST', '/auth/register',       'AuthController', 'register');
$router->add('GET',  '/auth/me',             'AuthController', 'me');
$router->add('PUT',  '/auth/profile',        'AuthController', 'updateProfile');
$router->add('PUT',  '/auth/password',       'AuthController', 'updatePassword');

// Admin user-approval 
$router->add('GET',  '/admin/users',         'AuthController', 'listUsers');
$router->add('POST', '/admin/users/approve', 'AuthController', 'approveUser');
$router->add('POST', '/admin/users/reject',  'AuthController', 'rejectUser');

// enterprise code
$router->add('POST', '/util/hash-code',      'AuthController', 'generateCodeHash');
$router->add("GET", "/admin/debug-users", "AuthController", "debugUsers");
