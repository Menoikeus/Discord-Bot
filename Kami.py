import discord
import asyncio

from datetime import datetime, time

client = discord.Client()

@client.event
async def on_ready():
    print('Logged in as')
    print(client.user.name)
    print(client.user.id)
    print('------')

@client.event
async def on_message(message):
    if message.content.startswith('!test'):
        counter = 0
        tmp = await client.send_message(message.channel, 'Calculating messages...')
        async for log in client.logs_from(message.channel, limit=100):
            if log.author == message.author:
                counter += 1

        await client.edit_message(tmp, 'You have {} messages.'.format(counter))
    elif message.content.startswith('!sleep'):
        await asyncio.sleep(5)
        await client.send_message(message.channel, 'Done sleeping')
		
@client.event
warning_message = None
async def on_message(message):
	now = datetime.now()
	now_time = now.time()
	if "porn" in message.content and "http" in message.content and now_time <= time(23,00):
		await client.delete_message(message)
		await client.delete_message(warning_message)
		warning_message = await client.send_message(message.channel, "Please no pornographic material before 11:00 PM EST")

client.run('MzA5ODk2MDQwMjc3MDgyMTEz.C-2E4g.M1KkH422h7UYwJN1ij94QZL1Vps')