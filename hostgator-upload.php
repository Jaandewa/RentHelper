<?php
// hostgator-upload.php
// A simple PHP script to handle image uploads for RentHelper

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Ensure the uploads directory exists
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Function to generate a unique filename
function generateUniqueFileName($originalName) {
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $timestamp = time();
    $randomStr = bin2hex(random_bytes(4));
    return "img_{$timestamp}_{$randomStr}.{$extension}";
}

$uploadedFiles = [];
$errors = [];

// Base URL of the domain where this script is hosted
// Change this to your actual subdomain, e.g., https://uploads.healingcity.lk
$baseUrl = "https://" . $_SERVER['HTTP_HOST'];

if (isset($_FILES['images'])) {
    // Reorganize the $_FILES array for easier iteration
    $files = $_FILES['images'];
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $fileCount; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];

        if ($error === UPLOAD_ERR_OK) {
            // Validate file size (max 10MB)
            if ($size > 10 * 1024 * 1024) {
                $errors[] = "$name is too large (max 10MB)";
                continue;
            }

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $tmpName);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = "$name has invalid file type (only JPG, PNG, WEBP allowed)";
                continue;
            }

            $newName = generateUniqueFileName($name);
            $destination = $uploadDir . $newName;

            if (move_uploaded_file($tmpName, $destination)) {
                $uploadedFiles[] = [
                    "originalName" => $name,
                    "url" => $baseUrl . "/uploads/" . $newName,
                    "size" => $size
                ];
            } else {
                $errors[] = "Failed to move uploaded file $name";
            }
        } else {
            $errors[] = "Error uploading $name (code $error)";
        }
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "No files were uploaded under the 'images' field."]);
    exit;
}

$response = [
    "success" => count($uploadedFiles) > 0,
    "files" => $uploadedFiles,
];

if (count($errors) > 0) {
    $response["errors"] = $errors;
}

echo json_encode($response);
