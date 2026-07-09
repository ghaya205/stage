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

// Requests (work certificate, salary certificate, leave entitlement)
$router->add('POST', '/requests/create', 'RequestController', 'create');
$router->add('GET',  '/requests/mine',   'RequestController', 'mine');
$router->add('GET',  '/requests/all',    'RequestController', 'all');
$router->add('POST', '/requests/reply',  'RequestController', 'reply');

// Qualifications (diplomas and certifications with proof)
$router->add('GET',  '/qualifications/mine',         'QualificationController', 'mine');
$router->add('POST', '/qualifications/create',       'QualificationController', 'create');
$router->add('POST', '/qualifications/delete',       'QualificationController', 'delete');
$router->add('GET',  '/admin/qualifications',        'QualificationController', 'all');
$router->add('POST', '/admin/qualifications/delete', 'QualificationController', 'adminDelete');
$router->add('POST', '/admin/qualifications/approve','QualificationController', 'approve');

// My documents
$router->add('GET',  '/documents/mine',   'DocumentController', 'mine');
$router->add('POST', '/documents/upload', 'DocumentController', 'upload');
$router->add('POST', '/documents/delete', 'DocumentController', 'delete');

// Internal opportunities
$router->add('GET',  '/opportunities',        'OpportunityController', 'list');
$router->add('POST', '/opportunities/create', 'OpportunityController', 'create');
$router->add('POST', '/opportunities/delete', 'OpportunityController', 'delete');

// SLA dashboard
$router->add('POST', '/sla/import-targets',   'SlaController', 'importTargets');
$router->add('POST', '/sla/import-data',      'SlaController', 'importData');
$router->add('GET',  '/sla/companies',        'SlaController', 'companies');
$router->add('GET',  '/sla/dashboard',        'SlaController', 'adminDashboard');
$router->add('GET',  '/sla/dashboard/mine',   'SlaController', 'supervisorDashboard');

// Insurance / care bulletins
$router->add('POST', '/insurance/create', 'InsuranceController', 'create');
$router->add('GET',  '/insurance/mine',   'InsuranceController', 'mine');
$router->add('GET',  '/insurance/all',    'InsuranceController', 'all');
$router->add('POST', '/insurance/status', 'InsuranceController', 'updateStatus');
