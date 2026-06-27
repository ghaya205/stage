<?php

/** @var \Core\Router $router */

$router->add('POST', '/auth/login',    'AuthController', 'login');
$router->add('POST', '/auth/register', 'AuthController', 'register');
$router->add('GET',  '/auth/me',       'AuthController', 'me');
