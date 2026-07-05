<?php

/** @var \Core\Router $router */

$router->add('GET',  '/ping',                'AuthController', 'ping');
$router->add('POST', '/auth/login',          'AuthController', 'login');
$router->add('POST', '/auth/register',       'AuthController', 'register');
$router->add('GET',  '/auth/me',             'AuthController', 'me');
$router->add('PUT',  '/auth/profile',        'AuthController', 'updateProfile');
$router->add('PUT',  '/auth/password',       'AuthController', 'updatePassword');
$router->add('GET',  '/auth/profile/full',   'AuthController', 'fullProfile');
$router->add('PUT',  '/auth/profile/full',   'AuthController', 'updateFullProfile');
$router->add('POST', '/auth/profile/picture','AuthController', 'uploadProfilePicture');

// Admin user-approval 
$router->add('GET',  '/admin/users',         'AuthController', 'listUsers');
$router->add('POST', '/admin/users/approve', 'AuthController', 'approveUser');
$router->add('POST', '/admin/users/reject',  'AuthController', 'rejectUser');
$router->add('POST', '/admin/users/create',  'AuthController', 'adminCreateUser');

// Presence (daily check-in)
$router->add('POST', '/presence/mark',  'PresenceController', 'markToday');
$router->add('GET',  '/presence/me',    'PresenceController', 'myToday');
$router->add('GET',  '/admin/presence', 'PresenceController', 'listToday');

// Desks
$router->add('GET',  '/desks',        'DeskController', 'list');
$router->add('POST', '/desks/create', 'DeskController', 'create');
$router->add('POST', '/desks/update', 'DeskController', 'update');

// enterprise code
$router->add('POST', '/util/hash-code',      'AuthController', 'generateCodeHash');
$router->add("GET", "/admin/debug-users", "AuthController", "debugUsers");
