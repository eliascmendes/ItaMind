// Construção do backend.
const { error } = require('console')
const express = require('express')
const {Pool} = require('pool')


const databaseUrl = process.env.DATABASE_URL

if (databaseUrl) {
    console.error("Erro.")
    throw new error("DATABASE ERROR.")
}