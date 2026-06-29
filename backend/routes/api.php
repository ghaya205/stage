<?php

/** @var \Core\Router $router */

$router->add('GET',  '/ping',          'AuthController', 'ping');
$router->add('POST', '/auth/login',    'AuthController', 'login');
$router->add('POST', '/auth/register', 'AuthController', 'register');
$router->add('GET',  '/auth/me',       'AuthController', 'me');
$router->add('PUT',  '/auth/profile',  'AuthController', 'updateProfile');
$router->add('PUT',  '/auth/password', 'AuthController', 'updatePassword');
