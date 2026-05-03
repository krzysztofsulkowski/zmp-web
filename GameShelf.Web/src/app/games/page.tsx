import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Games.module.css";
import logo from "@/assets/logo.svg";
import { useSearchParams } from 'react-router-dom';

export default function GamesPage() {
    const [searchParams] = useSearchParams();
    const collectionId = searchParams.get('collectionId');

    return (
        <main>
            <h1>Games</h1>
            <p>Collection ID: {collectionId}</p>
        </main>
    );
}